const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("../../routes/authRoutes");
const orderRoutes = require("../../routes/orderRoutes");
const orderCtrls = require("../../controllers/orderCtrls");
const productRoutes = require("../../routes/productRoutes");
const { errorHandler, notFound } = require("../../middlewares/errorHandler");

const buildTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/products", productRoutes);

  // Mirrors server.js: the Stripe webhook needs the raw body for signature
  // verification, so it is mounted before the JSON body parser.
  app.post(
    "/api/orders/webhook",
    express.raw({ type: "application/json" }),
    orderCtrls.stripeWebhook
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = buildTestApp;
