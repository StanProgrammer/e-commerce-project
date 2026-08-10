// Scheduled admin job processors: low-stock alerts and soft-delete cleanup.
const Product = require("../models/prdModel");
const Order = require("../models/orderModel");
const Blog = require("../models/blogModel");
const { config } = require("../config/env");
const { sendLowStockAlertEmail } = require("../utils/email");

const DAY_MS = 24 * 60 * 60 * 1000;

// Email the store inbox when tracked products run low on stock.
const runLowStockCheck = async (job) => {
  const threshold = Number(
    job.data.minStock ?? config.jobs.lowStockThreshold
  );

  const products = await Product.find({
    isDeleted: false,
    stock: { $exists: true, $lte: threshold },
  })
    .select("name category stock price")
    .sort({ stock: 1 })
    .limit(50);

  if (!products.length) {
    return { checked: true, lowStock: 0 };
  }

  await sendLowStockAlertEmail({ products });
  return { checked: true, lowStock: products.length };
};

// Hard-delete old soft-deleted orders/blogs; products and users are kept.
const runSoftDeletePurge = async (job) => {
  const olderThanDays = Number(
    job.data.olderThanDays ?? config.jobs.purgeAfterDays
  );
  const cutoff = new Date(Date.now() - olderThanDays * DAY_MS);

  const [orders, blogs] = await Promise.all([
    Order.deleteMany({ isDeleted: true, updatedAt: { $lt: cutoff } }),
    Blog.deleteMany({ isDeleted: true, updatedAt: { $lt: cutoff } }),
  ]);

  return {
    purgedOrders: orders.deletedCount || 0,
    purgedBlogs: blogs.deletedCount || 0,
  };
};

const handlers = {
  "low-stock-check": runLowStockCheck,
  "purge-soft-deleted": runSoftDeletePurge,
};

module.exports = async (job) => {
  const handler = handlers[job.name];

  if (!handler) {
    throw new Error(`Unknown admin job: ${job.name}`);
  }

  return handler(job);
};
