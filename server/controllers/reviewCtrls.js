const Review = require("../models/reviewModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const Product = require("../models/prdModel.js");
const Order = require("../models/orderModel.js");
const User = require("../models/userModel.js");
const { default: mongoose } = require("mongoose");
const { invalidateMany, makeKey } = require("../utils/cache.js");

const reviewableOrderStatuses = ["processing", "shipped", "delivered"];

const postReview = asyncHandler(async (req, res) => {
  const { comment, rating, productId } = req.body;
  const userId = req.user.sub;

  const [user, product] = await Promise.all([
    User.findById(userId).select("email"),
    Product.findOne({ _id: productId, isDeleted: false }).select("_id"),
  ]);

  if (!user) {
    return res.status(401).json({ message: "You need to login to do this action." });
  }

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const purchasedOrder = await Order.findOne({
    email: user.email,
    isDeleted: false,
    status: { $in: reviewableOrderStatuses },
    "products.productId": productId,
  }).select("_id");

  if (!purchasedOrder) {
    return res.status(403).json({
      message: "You can only review products you have purchased.",
    });
  }

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

  await invalidateMany([
    "products:list:*",
    "products:related:*",
    makeKey("products", "detail", productId),
  ]);

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

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  if (req.user.role !== "admin" && req.user.sub !== String(userId)) {
    return res.status(403).json({ message: "You can only view your own reviews." });
  }

  const reviews = await Review.find({ userId })
    .populate("productId", "name images")
    .sort({ createdAt: -1 });

  // Always return 200
  return res.status(200).json(reviews);
});

module.exports = { postReview, getTotalReviews, getUserReviews };
