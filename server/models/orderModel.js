const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "canceled"],
      required: true,
    },
    time: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "canceled"],
      default: "pending",
    },
    statusHistory: [statusHistorySchema],

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ isDeleted: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
