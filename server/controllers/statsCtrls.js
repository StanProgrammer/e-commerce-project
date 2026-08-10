const asyncHandler = require("../middlewares/asyncHandler.js");
const User = require('../models/userModel');
const Order = require("../models/orderModel.js");
const Review = require("../models/reviewModel.js");
const Product = require("../models/prdModel.js");

const computeStatsForEmail = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    return null;
  }

  // Amount sums per order; item count sums across product lines.
  const [orderStats] = await Order.aggregate([
    { $match: { email, isDeleted: false } },
    {
      $facet: {
        spent: [
          { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
        ],
        purchased: [
          { $unwind: "$products" },
          { $group: { _id: null, totalPurchased: { $sum: "$products.quantity" } } },
        ],
      },
    },
  ]);

  const totalSpent = orderStats?.spent?.[0]?.totalSpent || 0;

  const totalPurchased = orderStats?.purchased?.[0]?.totalPurchased || 0;

  const totalReviews = await Review.countDocuments({
    userId: user._id,
  });

  return {
    email,
    totalReviews,
    totalPurchased,
    totalSpent,
  };
};

const getMyStats = asyncHandler(async (req, res) => {
  const stats = await computeStatsForEmail(req.user.email);

  if (!stats) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(stats);
});

const getUserStats = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (req.user.role !== "admin" && email !== req.user.email) {
    return res.status(403).json({ message: "You can only view your own stats." });
  }

  const stats = await computeStatsForEmail(email);

  if (!stats) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json(stats);
});

const getAdminStats = asyncHandler(async (req, res) => {
  const { lowStockThreshold } = require("../config/env").config.jobs;

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    totalReviews,
    lowStockProducts,
    outOfStockProducts,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    Order.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false }),
    Review.countDocuments(),
    Product.countDocuments({
      isDeleted: false,
      stock: { $exists: true, $lte: lowStockThreshold },
    }),
    Product.countDocuments({
      isDeleted: false,
      stock: { $exists: true, $lte: 0 },
    }),
  ]);

  const stats = await Order.aggregate([
    { $match: { isDeleted: false } },
    {
      $facet: {
        totalRevenue: [
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ],
        monthlyRevenue: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m",
                  date: "$createdAt",
                  timezone: "UTC"
                }
              },
              revenue: { $sum: "$amount" }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  const totalRevenue =
    stats[0].totalRevenue[0]?.total || 0;

  const monthlyRevenue =
    stats[0].monthlyRevenue.map(item => {
      const [year, month] = item._id.split("-");
      return { year, month, revenue: item.revenue };
    });

  res.status(200).json({
    totalUsers,
    totalOrders,
    totalProducts,
    totalReviews,
    totalRevenue,
    monthlyRevenue,
    lowStockCount: lowStockProducts,
    outOfStockCount: outOfStockProducts,
  });
});

module.exports = {
    getUserStats,
    getMyStats,
    getAdminStats
}
