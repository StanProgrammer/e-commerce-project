const trimTrailingSlash = (value = "") => String(value).trim().replace(/\/+$/g, "");

const parseCsv = (value = "") =>
  String(value)
    .split(",")
    .map((item) => trimTrailingSlash(item))
    .filter(Boolean);

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const clientUrl = trimTrailingSlash(process.env.CLIENT_URL || "http://localhost:5173");
const redisEnabled = parseBoolean(process.env.REDIS_ENABLED, Boolean(process.env.REDIS_URL));

const config = {
  nodeEnv,
  isProduction,
  isVercel: Boolean(process.env.VERCEL),
  port: process.env.PORT || 5000,
  dbUrl: process.env.DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || "7d",
  clientUrl,
  passwordResetClientUrl: trimTrailingSlash(process.env.PASSWORD_RESET_CLIENT_URL || clientUrl),
  corsOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    clientUrl,
    ...parseCsv(process.env.CLIENT_URLS),
    ...parseCsv(process.env.CORS_ORIGINS),
  ],
  cookie: {
    secure:
      process.env.COOKIE_SECURE === "true" ||
      (isProduction && process.env.COOKIE_SECURE !== "false"),
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? "none" : "lax"),
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  resendApiKey: process.env.RESEND_API_KEY,
  contactToEmail: process.env.CONTACT_TO_EMAIL,
  contactFromEmail: process.env.CONTACT_FROM_EMAIL,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS,
  smtpTimeoutMs: parsePositiveInteger(process.env.SMTP_TIMEOUT_MS, 45000),
  redis: {
    enabled: redisEnabled,
    url: process.env.REDIS_URL || "redis://localhost:6379",
    keyPrefix: process.env.REDIS_KEY_PREFIX || "wiles-rues:",
    connectTimeoutMs: parsePositiveInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 10000),
    pingTimeoutMs: parsePositiveInteger(process.env.REDIS_PING_TIMEOUT_MS, 3000),
  },
  seedDefaultBlogs: process.env.SEED_DEFAULT_BLOGS !== "false",
};

config.corsOrigins = [...new Set(config.corsOrigins.map(trimTrailingSlash).filter(Boolean))];

const requireEnv = (entries, featureName = "application") => {
  const missing = entries.filter(([name, value]) => !value);

  if (missing.length) {
    const names = missing.map(([name]) => name).join(", ");
    throw new Error(`Missing ${featureName} environment variable(s): ${names}`);
  }
};

const validateCoreEnv = () => {
  requireEnv(
    [
      ["DB_URL", config.dbUrl],
      ["JWT_SECRET", config.jwtSecret],
    ],
    "core server"
  );
};

const validateRedisEnv = () => {
  if (!config.redis.enabled) {
    return;
  }

  if (config.isProduction && !process.env.REDIS_URL) {
    throw new Error("Missing Redis environment variable(s): REDIS_URL");
  }
};

module.exports = {
  config,
  requireEnv,
  trimTrailingSlash,
  validateCoreEnv,
  validateRedisEnv,
};
