// Producer for the "emails" queue; see workers/emailWorker.js for the consumer.
const { Queue } = require("bullmq");
const { getQueueConnection } = require("./connection");

let queue = null;
let queueConnection = null;

const getEmailQueue = () => {
  const connection = getQueueConnection();

  if (!connection) {
    return null;
  }

  // Rebuild the queue if Redis went down and a fresh connection was created.
  if (!queue || queueConnection !== connection) {
    queue = new Queue("emails", { connection });
    queueConnection = connection;
  }

  return queue;
};

// Add an email job, or return null when Redis is down so callers send inline.
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
