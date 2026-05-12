require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { config, trimTrailingSlash } = require('./config/env');
const { connectDatabase } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const blogRoutes = require('./routes/blogRoutes');
const policyRoutes = require('./routes/policyRoutes');
const uploadImage = require('./utils/uploadImage');
const seedDefaultBlogs = require('./utils/seedDefaultBlogs');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// --- Body parsers (must come before routes) ---
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());
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

let appInitPromise = null;

const initializeApp = async () => {
  if (!appInitPromise) {
    appInitPromise = connectDatabase()
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

// --- Routes ---z
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


app.get('/', (req, res) => res.send('Wiles and Rues'));
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    dbState: mongoose.connection.readyState,
  });
});

app.post("/api/upload-image", async (req, res, next) => {
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
