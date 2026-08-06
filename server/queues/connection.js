// Shared connections for BullMQ queues and workers.
//
// BullMQ cannot reuse the node-redis client from config/redis.js (it relies on
// ioredis semantics and blocking commands), so it gets its own connections.
// Both share the same Redis server: cache keys are prefixed with the
// "wiles-rues:" prefix while BullMQ uses its own "bull:" prefix.
//
// Two connection flavours:
// - Producers (the Express API) fail fast with a bounded reconnect strategy so
//   a Redis outage never hangs HTTP requests. Callers treat enqueue failures
//   as "queue unavailable" and run the work inline instead.
// - Workers retry indefinitely so a brief Redis blip does not kill the
//   background worker process.
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
      // Give up after a few attempts so connect() rejects quickly (~0.6s) and
      // API requests never hang on a downed Redis. Returning null stops
      // reconnection; the next getQueueConnection() call builds a fresh
      // connection, so recovery is automatic.
      return times > 3 ? null : Math.min(times * 100, 1000);
    },
  });

const getQueueConnection = () => {
  if (!config.redis.enabled) {
    return null;
  }

  if (!connection || connection.status === "end") {
    connection = createProducerConnection();
    // Reconnect attempts log one error per try; keep the noise down and rely
    // on the enqueue call sites for actionable messages.
    connection.on("error", () => {});
    connection.on("end", () => {
      console.error(
        "[bullmq] Redis connection lost — background jobs will run inline until Redis is reachable again."
      );
    });
  }

  return connection;
};

// Workers keep retrying forever: BullMQ needs its blocking commands to
// reconnect across brief outages, and the worker runs in its own process so a
// stuck connection does not affect API latency.
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
