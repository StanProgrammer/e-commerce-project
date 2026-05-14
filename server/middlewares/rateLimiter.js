const DEFAULT_WINDOW_MS = 15 * 60 * 1000;

const stores = new Map();

const cleanupStore = (store, now = Date.now()) => {
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime <= now) {
      store.delete(key);
    }
  }
};

const getClientKey = (req) => {
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const buildRateLimitResponse = (message, retryAfterSeconds) => ({
  message,
  retryAfterSeconds,
});

const createRateLimiter = ({
  name,
  windowMs = DEFAULT_WINDOW_MS,
  max = 100,
  message = "Too many requests. Please wait a moment and try again.",
  keyGenerator = getClientKey,
  skip,
} = {}) => {
  const storeName = name || `${windowMs}:${max}:${message}`;

  if (!stores.has(storeName)) {
    stores.set(storeName, new Map());
  }

  const store = stores.get(storeName);

  return (req, res, next) => {
    if (typeof skip === "function" && skip(req)) {
      return next();
    }

    const now = Date.now();
    const key = keyGenerator(req);
    const existing = store.get(key);

    if (!existing || existing.resetTime <= now) {
      cleanupStore(store, now);

      const resetTime = now + windowMs;
      store.set(key, {
        count: 1,
        resetTime,
      });

      res.setHeader("RateLimit-Limit", max);
      res.setHeader("RateLimit-Remaining", Math.max(max - 1, 0));
      res.setHeader("RateLimit-Reset", Math.ceil(resetTime / 1000));

      return next();
    }

    existing.count += 1;

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetTime - now) / 1000)
    );
    const remaining = Math.max(max - existing.count, 0);

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", Math.ceil(existing.resetTime / 1000));

    if (existing.count > max) {
      res.setHeader("Retry-After", retryAfterSeconds);

      return res
        .status(429)
        .json(buildRateLimitResponse(message, retryAfterSeconds));
    }

    return next();
  };
};

const apiLimiter = createRateLimiter({
  name: "api",
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "You are sending requests too quickly. Please wait a moment and try again.",
  skip: (req) => req.path === "/health",
});

const authLimiter = createRateLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many sign-in attempts. Please wait 15 minutes before trying again.",
});

const passwordLimiter = createRateLimiter({
  name: "password",
  windowMs: 60 * 60 * 1000,
  max: 4,
  message: "Too many password reset attempts. Please wait before requesting another reset.",
});

const contactLimiter = createRateLimiter({
  name: "contact",
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many messages sent. Please wait before sending another message.",
});

const checkoutLimiter = createRateLimiter({
  name: "checkout",
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many checkout attempts. Please wait a few minutes and try again.",
});

const uploadLimiter = createRateLimiter({
  name: "upload",
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many uploads. Please wait a few minutes and try again.",
});

const writeLimiter = createRateLimiter({
  name: "write",
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many changes submitted. Please wait a few minutes and try again.",
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  passwordLimiter,
  contactLimiter,
  checkoutLimiter,
  uploadLimiter,
  writeLimiter,
};
