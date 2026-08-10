// Admin-protected Bull Board dashboard for monitoring BullMQ queues.
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { getQueueConnection } = require("./connection");
const { getEmailQueue } = require("./emailQueue");
const { getAdminQueue } = require("./adminQueue");

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/queues");

let initialized = false;

// Returns the Bull Board router, or null when Redis is disabled (no queues).
const getBullBoardRouter = () => {
  if (!getQueueConnection()) {
    return null;
  }

  if (!initialized) {
    const queues = [getEmailQueue(), getAdminQueue()].filter(Boolean);

    createBullBoard({
      queues: queues.map((queue) => new BullMQAdapter(queue)),
      serverAdapter,
    });

    initialized = true;
  }

  return serverAdapter.getRouter();
};

module.exports = { getBullBoardRouter };
