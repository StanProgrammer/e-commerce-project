const Feedback = require("../models/feedbackModel");
const User = require("../models/userModel");
const asyncHandler = require("../middlewares/asyncHandler");
const mongoose = require("mongoose");

const createFeedback = asyncHandler(async (req, res) => {
  const { type, title, description, pageUrl = "" } = req.body;
  let userInfo = {
    userId: null,
    username: "Anonymous",
    email: "",
    role: "guest",
  };

  if (req.user?.sub) {
    const user = await User.findOne({ _id: req.user.sub, isDeleted: false })
      .select("username email role")
      .lean();

    if (user) {
      userInfo = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }
  }

  const feedback = await Feedback.create({
    type,
    title,
    description,
    user: userInfo,
    pageUrl,
    userAgent: req.get("user-agent") || "",
  });

  return res.status(201).json({
    message: "Feedback submitted successfully.",
    feedback,
  });
});

const getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({
    "user.userId": req.user.sub,
    isDeleted: false,
  })
    .select("type title description status pageUrl createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(feedback);
});

const getAllFeedback = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const query = { isDeleted: false };

  if (status && status !== "all") {
    query.status = status;
  }

  if (type && type !== "all") {
    query.type = type;
  }

  const feedback = await Feedback.find(query)
    .select("type title description status user pageUrl userAgent createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(feedback);
});

const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid feedback ID." });
  }

  const feedback = await Feedback.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { status } },
    { new: true }
  ).select("type title description status user pageUrl userAgent createdAt updatedAt");

  if (!feedback) {
    return res.status(404).json({ message: "Feedback report not found." });
  }

  return res.status(200).json({
    message: "Feedback status updated.",
    feedback,
  });
});

module.exports = {
  createFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
};
