require('dotenv').config({ quiet: true });

// Load environment-specific overrides on top of .env:
// - development (default): .env.local
// - production:            .env.production
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: envFile, override: true, quiet: true });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { config, trimTrailingSlash } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { connectRedis, getRedisHealth } = require('./config/redis');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const orderCtrls = require('./controllers/orderCtrls');
const statsRoutes = require('./routes/statsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const policyRoutes = require('./routes/policyRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const uploadImage = require('./utils/uploadImage');
const seedDefaultBlogs = require('./utils/seedDefaultBlogs');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { apiLimiter, uploadLimiter } = require('./middlewares/rateLimiter');
const { verifyToken } = require('./utils/helper');
const adminOnly = require('./middlewares/adminOnly');

const app = express();

app.set('trust proxy', 1);

// --- CORS ---
const allowedOrigins = new Set(config.corsOrigins);

const allowedOriginPatterns = [
  /^https:\/\/e-commerce-project-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/e-commerce-project-[a-z0-9-]+-atib-khans-projects\.vercel\.app$/,
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = trimTrailingSlash(origin);
    const isAllowed =
      allowedOrigins.has(normalizedOrigin) ||
      allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin));

    if (isAllowed) return callback(null, true);

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

const isTrustedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = trimTrailingSlash(origin);
  return (
    allowedOrigins.has(normalizedOrigin) ||
    allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
  );
};

app.use('/api', (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const requestOrigin = req.get("origin");
  const referer = req.get("referer");

  if (requestOrigin && !isTrustedOrigin(requestOrigin)) {
    return res.status(403).json({ message: "Request origin is not allowed." });
  }

  if (!requestOrigin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!isTrustedOrigin(refererOrigin)) {
        return res.status(403).json({ message: "Request origin is not allowed." });
      }
    } catch {
      return res.status(403).json({ message: "Request origin is not allowed." });
    }
  }

  return next();
});

app.use('/api', apiLimiter);

let appInitPromise = null;

const initializeApp = async () => {
  if (!appInitPromise) {
    appInitPromise = connectDatabase()
      .then(async () => {
        try {
          await connectRedis();
        } catch (error) {
          console.error("Redis initialization failed; continuing without cache:", error.message);
        }
      })
      .then(async () => {
        if (config.seedDefaultBlogs) {
          await seedDefaultBlogs();
        }
      })
      .catch((error) => {
        appInitPromise = null;
        throw error;
      });
  }

  return appInitPromise;
};

app.use('/api', async (req, res, next) => {
  try {
    await initializeApp();
    next();
  } catch (error) {
    next(error);
  }
});

// Stripe webhook: needs the raw request body for signature verification, so
// it is mounted before the JSON body parser. It runs after the DB-init
// middleware above so orders can be recorded in all deployment modes.
app.post(
  '/api/orders/webhook',
  express.raw({ type: 'application/json', limit: '2mb' }),
  orderCtrls.stripeWebhook
);

// --- Body parsers (must come before routes) ---
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/feedback', feedbackRoutes);


app.get('/', (req, res) => res.send('Wiles and Rues'));
app.get('/api/health', async (req, res, next) => {
  try {
    const redis = await getRedisHealth();

    res.status(200).json({
      status: redis.status === 'error' ? 'degraded' : 'ok',
      environment: config.nodeEnv,
      dbState: mongoose.connection.readyState,
      redis,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/upload-image", uploadLimiter, verifyToken, adminOnly, async (req, res, next) => {
  // Handle image upload logic here (e.g., save to disk or cloud storage)
  try {
    const url = await uploadImage(req.body.image);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await initializeApp();
    app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

if (!config.isVercel) {
  start();
}

module.exports = app;
