// Producer for the "emails" queue (order confirmation, order status and
// password reset emails). See server/workers/emailWorker.js for the consumer.
const { Queue } = require("bullmq");
const { getQueueConnection } = require("./connection");

let queue = null;
let queueConnection = null;

const getEmailQueue = () => {
  const connection = getQueueConnection();

  if (!connection) {
    return null;
  }

  // Rebuild the queue if the connection was replaced (e.g. Redis went down and
  // getQueueConnection() created a fresh one).
  if (!queue || queueConnection !== connection) {
    queue = new Queue("emails", { connection });
    queueConnection = connection;
  }

  return queue;
};

// Add an email job when Redis/BullMQ is available; returns null when it is
// not (Redis disabled, or unreachable), so callers fall back to sending inline
// — mirroring the cache SKIP/BYPASS behaviour used when Redis is disabled.
const addEmailJob = async (name, data, options = {}) => {
  const emailQueue = getEmailQueue();

  if (!emailQueue) {
    return null;
  }

  try {
    return await emailQueue.add(name, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
      ...options,
    });
  } catch (error) {
    console.error(`[bullmq] Failed to enqueue "${name}" email job:`, error.message);
    return null;
  }
};

module.exports = { addEmailJob, getEmailQueue };
