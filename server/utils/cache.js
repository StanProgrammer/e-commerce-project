const { config } = require("../config/env");
const { connectRedis } = require("../config/redis");

const DEFAULT_TTL_SECONDS = 60;

const ttl = {
  productsList: Number.parseInt(process.env.CACHE_PRODUCTS_LIST_TTL_SECONDS, 10) || 120,
  productDetail: Number.parseInt(process.env.CACHE_PRODUCT_DETAIL_TTL_SECONDS, 10) || 300,
  relatedProducts: Number.parseInt(process.env.CACHE_RELATED_PRODUCTS_TTL_SECONDS, 10) || 180,
  blogsList: Number.parseInt(process.env.CACHE_BLOGS_LIST_TTL_SECONDS, 10) || 180,
  blogDetail: Number.parseInt(process.env.CACHE_BLOG_DETAIL_TTL_SECONDS, 10) || 600,
  policy: Number.parseInt(process.env.CACHE_POLICY_TTL_SECONDS, 10) || 900,
  default: DEFAULT_TTL_SECONDS,
};

const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

const normalizeQuery = (query = {}) =>
  Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => [key, String(value)])
      .sort(([left], [right]) => left.localeCompare(right))
  );

const makeKey = (...parts) =>
  parts
    .flat()
    .filter((part) => part !== undefined && part !== null && part !== "")
    .map((part) => {
      if (typeof part === "object") {
        return stableStringify(part);
      }

      return String(part).trim();
    })
    .join(":");

const prefixKey = (key) => `${config.redis.keyPrefix}${key}`;

const logCache = (event, details = {}) => {
  const detailText = Object.entries(details)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.info(`[cache] ${event}${detailText ? ` ${detailText}` : ""}`);
};

const readThrough = async (key, fetcher, options = {}) => {
  const seconds = options.ttlSeconds || ttl.default;

  if (!config.redis.enabled) {
    logCache("skip", { key, reason: "disabled" });
    return { value: await fetcher(), cacheStatus: "SKIP" };
  }

  try {
    const redis = await connectRedis();
    const redisKey = prefixKey(key);
    const cached = await redis.get(redisKey);

    if (cached) {
      logCache("hit", { key });
      return { value: JSON.parse(cached), cacheStatus: "HIT" };
    }

    logCache("miss", { key });
    const value = await fetcher();

    await redis.set(redisKey, JSON.stringify(value), { EX: seconds });
    logCache("set", { key, ttl: seconds });

    return { value, cacheStatus: "MISS" };
  } catch (error) {
    logCache("error", { key, message: error.message });
    return { value: await fetcher(), cacheStatus: "BYPASS" };
  }
};

const invalidateByPattern = async (pattern) => {
  if (!config.redis.enabled) {
    return 0;
  }

  try {
    const redis = await connectRedis();
    const redisPattern = prefixKey(pattern);
    const keys = [];

    for await (const item of redis.scanIterator({ MATCH: redisPattern, COUNT: 100 })) {
      if (Array.isArray(item)) {
        keys.push(...item);
      } else {
        keys.push(item);
      }
    }

    if (!keys.length) {
      logCache("invalidate", { pattern, count: 0 });
      return 0;
    }

    const batchSize = 100;
    for (let index = 0; index < keys.length; index += batchSize) {
      await redis.del(keys.slice(index, index + batchSize));
    }

    logCache("invalidate", { pattern, count: keys.length });
    return keys.length;
  } catch (error) {
    logCache("invalidate_error", { pattern, message: error.message });
    return 0;
  }
};

const invalidateMany = async (patterns = []) => {
  const uniquePatterns = [...new Set(patterns.filter(Boolean))];
  const counts = await Promise.all(uniquePatterns.map(invalidateByPattern));
  return counts.reduce((sum, count) => sum + count, 0);
};

const setCacheHeader = (res, status) => {
  if (status) {
    res.set("X-Cache", status);
  }
};

module.exports = {
  invalidateByPattern,
  invalidateMany,
  makeKey,
  normalizeQuery,
  readThrough,
  setCacheHeader,
  ttl,
};
