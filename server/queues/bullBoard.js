// Admin-protected Bull Board dashboard for monitoring the BullMQ queues in
// the browser. server.js mounts the returned router at /api/queues behind the
// verifyToken + adminOnly middlewares.
//
// Uses the Bull Board v8 API: createBullBoard (@bull-board/api) + ExpressAdapter
// (@bull-board/express) + BullMQAdapter (@bull-board/api/bullMQAdapter).
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const { getQueueConnection } = require("./connection");
const { getEmailQueue } = require("./emailQueue");
const { getAdminQueue } = require("./adminQueue");

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/queues");

let initialized = false;

// Returns the Bull Board router, or null when Redis is disabled (there are no
// queues to monitor).
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
