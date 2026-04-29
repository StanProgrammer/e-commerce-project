// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');

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
// const { errorHandler } = require('./middleware/errorHandler');
const uploadImage = require('./utils/uploadImage');
const seedDefaultBlogs = require('./utils/seedDefaultBlogs');
const app = express();

// --- Basic security + logging ---
// app.use(helmet());
// app.use(morgan('dev'));

// --- Rate limiter (basic) ---
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// --- Body parsers (must come before routes) ---
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());

// --- CORS ---
const configuredClientOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((origin) => origin.trim().replace(/\/+$/g, ''))
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  ...configuredClientOrigins,
]);

const allowedOriginPatterns = [
  /^https:\/\/e-commerce-project-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/e-commerce-project-[a-z0-9-]+-atib-khans-projects\.vercel\.app$/,
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/g, '');
    const isAllowed =
      allowedOrigins.has(normalizedOrigin) ||
      allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin));

    if (isAllowed) return callback(null, true);

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
}));

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

// --- Error handling middleware (last) ---
// app.use(errorHandler);

// --- DB connect and start ---
const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await mongoose.connect(process.env.DB_URL, {  });
    console.log('Connected to MongoDB');
    await seedDefaultBlogs();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}
app.post("upload-image", (req, res) => {
  // Handle image upload logic here (e.g., save to disk or cloud storage)
  uploadImage(req.body.image)
    .then((url) => res.json({ url }))
    .catch((err) => res.status(500).json({ error: 'Image upload failed', details: err.message }));
});
start();
