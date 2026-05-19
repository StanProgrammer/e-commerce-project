const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bug", "feature"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved", "rejected"],
      default: "new",
      index: true,
    },
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      username: { type: String, trim: true, default: "Anonymous" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      role: { type: String, trim: true, default: "guest" },
    },
    pageUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
