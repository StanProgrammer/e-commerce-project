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

// --- CORS (origin from env) ---
const CLIENT_ORIGIN  = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: CLIENT_ORIGIN,
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
