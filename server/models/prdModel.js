const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique auto-generated SKU (e.g. WATCH-BLK-001); sparse so legacy items still work.
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    oldPrice: {
      type: Number,
      min: 0,
    },

    // Inventory count; absent means unlimited stock.
    stock: {
      type: Number,
      min: 0,
    },

    images: {
  type: [String],
  required: true,
},

    color: {
      type: String,
      lowercase: true,
      trim: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
