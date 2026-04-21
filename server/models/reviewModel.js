const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
    comment: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;