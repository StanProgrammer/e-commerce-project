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

  // The Stripe webhook needs the raw body, so mount it before the JSON parser.
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
