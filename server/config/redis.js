const { createClient } = require("redis");
const { config, validateRedisEnv } = require("./env");

let client = null;
let connectionPromise = null;
let lastError = null;

const withTimeout = (promise, timeoutMs, message) => {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const getRedisClient = () => {
  if (!config.redis.enabled) {
    return null;
  }

  if (client) {
    return client;
  }

  validateRedisEnv();

  client = createClient({
    url: config.redis.url,
    socket: {
      connectTimeout: config.redis.connectTimeoutMs,
      reconnectStrategy(retries) {
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on("error", (error) => {
    lastError = error;
    console.error("Redis error:", error.message);
  });

  client.on("connect", () => {
    lastError = null;
    console.log("Connected to Redis");
  });

  return client;
};

const connectRedis = async () => {
  const redisClient = getRedisClient();

  if (!redisClient) {
    return null;
  }

  if (redisClient.isOpen) {
    return redisClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = withTimeout(
    redisClient.connect().then(async () => {
      await withTimeout(
        redisClient.ping(),
        config.redis.pingTimeoutMs,
        "Redis ping timed out"
      );

      return redisClient;
    }),
    config.redis.connectTimeoutMs + config.redis.pingTimeoutMs,
    "Redis connection timed out"
  ).catch((error) => {
    connectionPromise = null;
    lastError = error;
    throw error;
  });

  return connectionPromise;
};

const getRedisHealth = async () => {
  if (!config.redis.enabled) {
    return {
      enabled: false,
      status: "disabled",
    };
  }

  const startedAt = Date.now();

  try {
    const redisClient = await connectRedis();
    await withTimeout(
      redisClient.ping(),
      config.redis.pingTimeoutMs,
      "Redis ping timed out"
    );

    return {
      enabled: true,
      status: "ok",
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      enabled: true,
      status: "error",
      message: error.message,
    };
  }
};

const closeRedis = async () => {
  if (client?.isOpen) {
    await client.quit();
  }

  client = null;
  connectionPromise = null;
  lastError = null;
};

module.exports = {
  connectRedis,
  getRedisClient,
  getRedisHealth,
  closeRedis,
  getLastRedisError: () => lastError,
};
