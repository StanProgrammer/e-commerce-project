process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_dummy";
process.env.REDIS_ENABLED = "false";
// Keep the in-memory rate limiter out of the way during test runs.
process.env.AUTH_RATE_LIMIT_MAX = "1000";
process.env.PASSWORD_RATE_LIMIT_MAX = "1000";
process.env.CHECKOUT_RATE_LIMIT_MAX = "1000";
