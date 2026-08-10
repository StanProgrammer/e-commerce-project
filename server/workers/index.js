// BullMQ worker process (npm run worker); starts email + admin workers and cron.
require("dotenv").config({ quiet: true });
require("dotenv").config({
  path:
    process.env.NODE_ENV === "production" ? ".env.production" : ".env.local",
  override: true,
  quiet: true,
});

const { Queue, Worker } = require("bullmq");
const { getWorkerConnection } = require("../queues/connection");
const emailProcessor = require("./emailWorker");
const adminProcessor = require("./adminWorker");

// Recurring cron jobs; upsertJobScheduler is idempotent, so re-registering is safe.
const SCHEDULERS = [
  {
    schedulerId: "low-stock-check",
    repeat: { pattern: "0 9 * * *", tz: "UTC" }, // daily at 09:00 UTC
    job: { name: "low-stock-check", data: {}, opts: { attempts: 2 } },
  },
  {
    schedulerId: "purge-soft-deleted",
    repeat: { pattern: "0 3 * * *", tz: "UTC" }, // daily at 03:00 UTC
    job: { name: "purge-soft-deleted", data: {}, opts: { attempts: 2 } },
  },
];

const start = async () => {
  const connection = getWorkerConnection();

  if (!connection) {
    console.log("[worker] Redis is disabled — no background workers started.");
    process.exit(0);
  }

  // Log the worker connection lifecycle so a Redis outage is visible.
  connection.on("connecting", () => console.log("[worker] Connecting to Redis..."));
  connection.on("ready", () => console.log("[worker] Redis connected."));
  connection.on("error", (error) =>
    console.error("[worker] Redis error:", error.message)
  );

  const emailWorker = new Worker("emails", emailProcessor, {
    connection,
    concurrency: 5,
  });

  const adminWorker = new Worker("admin", adminProcessor, {
    connection,
    concurrency: 1,
  });

  const adminQueue = new Queue("admin", { connection });

  for (const scheduler of SCHEDULERS) {
    await adminQueue.upsertJobScheduler(
      scheduler.schedulerId,
      scheduler.repeat,
      scheduler.job
    );
  }

  const logCompleted = (queueName) => (job) =>
    console.log(`[worker] ${queueName}#${job.name} completed (${job.id})`);
  const logFailed = (queueName) => (job, err) =>
    console.error(`[worker] ${queueName}#${job?.name} failed:`, err.message);

  emailWorker.on("completed", logCompleted("emails"));
  emailWorker.on("failed", logFailed("emails"));
  adminWorker.on("completed", logCompleted("admin"));
  adminWorker.on("failed", logFailed("admin"));

  console.log("[worker] BullMQ workers running (emails + admin schedulers).");

  const shutdown = async (signal) => {
    console.log(`[worker] ${signal} received — closing workers...`);

    // Hard exit if graceful shutdown hangs
    const forceExit = setTimeout(() => process.exit(1), 15000);
    forceExit.unref();

    try {
      await Promise.all([emailWorker.close(), adminWorker.close()]);
      await adminQueue.close();
      await connection.quit().catch(() => {});
      process.exit(0);
    } catch (error) {
      console.error("[worker] Shutdown error:", error.message);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((error) => {
  console.error("[worker] Failed to start:", error.message);
  process.exit(1);
});
