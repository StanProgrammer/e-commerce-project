const mongoose = require("mongoose");

const policySectionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["buying", "selling", "general"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const policySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "terms-and-conditions",
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    introduction: {
      type: String,
      required: true,
      trim: true,
    },
    sections: {
      type: [policySectionSchema],
      default: [],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Policy = mongoose.model("Policy", policySchema);

module.exports = Policy;
