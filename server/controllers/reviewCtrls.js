const Review = require("../models/reviewModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const Product = require("../models/prdModel.js");
const { default: mongoose } = require("mongoose");
const postReview = asyncHandler(async (req, res) => {
  const { comment, rating, productId } = req.body;
  const userId = req.user.sub;

  const existingReview = await Review.findOne({ productId, userId });

  const review = await Review.findOneAndUpdate(
    { productId, userId },
    { $set: { comment, rating } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } }, // Ensure ObjectId type
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const avgRating = stats.length ? stats[0].avgRating : 0;

  await Product.findByIdAndUpdate(productId, {
    rating: avgRating,
  });

  // 4. Send differentiated message
  const message = existingReview 
    ? "Review updated successfully" 
    : "Review submitted successfully";

  return res.status(existingReview ? 200 : 201).json({
    message,
    review,
  });
});

const getTotalReviews = asyncHandler(async (req, res) => {
 const totalReviews = await Review.countDocuments();
 return res.status(200).json({ totalReviews });
});

const getUserReviews = asyncHandler(async (req, res) => {

  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  const reviews = await Review.find({ userId }).sort({ createdAt: -1 });

  // Always return 200
  return res.status(200).json(reviews);
});

module.exports = { postReview, getTotalReviews, getUserReviews };