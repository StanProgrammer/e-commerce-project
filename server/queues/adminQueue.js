// Producer for the "admin" queue (scheduled maintenance jobs such as
// low-stock alerts and soft-delete purging). Consumers + cron schedules live
// in server/workers/index.js and server/workers/adminWorker.js.
const { Queue } = require("bullmq");
const { getQueueConnection } = require("./connection");

let queue = null;
let queueConnection = null;

const getAdminQueue = () => {
  const connection = getQueueConnection();

  if (!connection) {
    return null;
  }

  // Rebuild the queue if the connection was replaced (e.g. Redis went down and
  // getQueueConnection() created a fresh one).
  if (!queue || queueConnection !== connection) {
    queue = new Queue("admin", { connection });
    queueConnection = connection;
  }

  return queue;
};

const addAdminJob = async (name, data, options = {}) => {
  const adminQueue = getAdminQueue();

  if (!adminQueue) {
    return null;
  }

  try {
    return await adminQueue.add(name, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
      ...options,
    });
  } catch (error) {
    console.error(`[bullmq] Failed to enqueue "${name}" admin job:`, error.message);
    return null;
  }
};

module.exports = { addAdminJob, getAdminQueue };
