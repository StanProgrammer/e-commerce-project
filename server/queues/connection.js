// BullMQ needs its own ioredis connections; producers fail fast, workers retry.
const IORedis = require("ioredis");
const { config } = require("../config/env");

let connection = null;

const createProducerConnection = () =>
  new IORedis(config.redis.url, {
    // Required: BullMQ relies on blocking commands that must not be retried.
    maxRetriesPerRequest: null,
    // Producers fail fast when Redis is down instead of buffering requests.
    enableOfflineQueue: false,
    connectTimeout: config.redis.connectTimeoutMs,
    retryStrategy(times) {
      // Give up quickly so requests never hang; next call builds a fresh connection.
      return times > 3 ? null : Math.min(times * 100, 1000);
    },
  });

const getQueueConnection = () => {
  if (!config.redis.enabled) {
    return null;
  }

  if (!connection || connection.status === "end") {
    connection = createProducerConnection();
    // Keep reconnect noise down; call sites log real errors.
    connection.on("error", () => {});
    connection.on("end", () => {
      console.error(
        "[bullmq] Redis connection lost — background jobs will run inline until Redis is reachable again."
      );
    });
  }

  return connection;
};

// Workers retry forever; they run in their own process, so API latency is unaffected.
const getWorkerConnection = () => {
  if (!config.redis.enabled) {
    return null;
  }

  return new IORedis(config.redis.url, {
    maxRetriesPerRequest: null,
    connectTimeout: config.redis.connectTimeoutMs,
  });
};

module.exports = {
  getQueueConnection,
  getWorkerConnection,
};
