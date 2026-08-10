const Order = require("../models/orderModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const createStripeClient = require("stripe");
const Product = require("../models/prdModel.js");
const { config, requireEnv } = require("../config/env.js");
const mongoose = require("mongoose");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} = require("../utils/email.js");
const { addEmailJob } = require("../queues/emailQueue.js");

let stripeClient = null;
const ORDER_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "canceled"]);
// Countries we ship to (shown in the Stripe checkout form).
const SHIPPING_COUNTRIES = [
  "US", "CA", "GB", "AU", "IN", "AE", "DE", "FR", "ES", "IT", "NL", "SG",
];

const getStripe = () => {
  if (!stripeClient) {
    requireEnv([["STRIPE_SECRET_KEY", config.stripeSecretKey]], "Stripe checkout");
    stripeClient = createStripeClient(config.stripeSecretKey);
  }

  return stripeClient;
};

// Only trust our own hosts for the post-payment redirect URL.
const allowedOriginPatterns = [
  /^https:\/\/e-commerce-project-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/e-commerce-project-[a-z0-9-]+-atib-khans-projects\.vercel\.app$/,
];

const isTrustedClientOrigin = (origin) => {
  if (!origin) return false;

  const normalizedOrigin = String(origin).replace(/\/+$/g, "");
  return (
    config.corsOrigins.includes(normalizedOrigin) ||
    allowedOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
  );
};

const getCheckoutClientUrl = (req) => {
  const origin = req.get("origin");

  if (origin && isTrustedClientOrigin(origin)) {
    return String(origin).replace(/\/+$/g, "");
  }

  return config.clientUrl.replace(/\/+$/g, "");
};

const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { products } = req.body;
  const email = req.user.email;
  const checkoutClientUrl = getCheckoutClientUrl(req);
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Products are required" });
  }

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const lineItems = [];
  for (const item of products) {
    const dbProduct = await Product.findOne({
      _id: item._id,
      isDeleted: false,
    });

    if (!dbProduct) {
      return res.status(404).json({
        message: `Product not found: ${item._id}`,
      });
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        message: `Invalid quantity for "${dbProduct.name}".`,
      });
    }

    // No stock field means unlimited; tracked items can't be oversold.
    if (
      dbProduct.stock !== undefined &&
      dbProduct.stock !== null &&
      quantity > dbProduct.stock
    ) {
      return res.status(400).json({
        message:
          dbProduct.stock <= 0
            ? `"${dbProduct.name}" is currently out of stock.`
            : `Only ${dbProduct.stock} left in stock for "${dbProduct.name}".`,
      });
    }

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: dbProduct.name,
          images: dbProduct.images?.length ? [dbProduct.images[0]] : [],
          metadata: {
            productId: dbProduct._id.toString(),
          },
        },
        unit_amount: Math.round(dbProduct.price * 100),
      },
      quantity,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
    phone_number_collection: { enabled: true },
    success_url: `${checkoutClientUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${checkoutClientUrl}/shop`,
  });

  res.status(200).json({
    id: session.id,
    url: session.url,
  });
});

const extractShippingAddress = (session) => {
  const shipping = session.shipping_details;
  const address = shipping?.address;

  if (!address) {
    return undefined;
  }

  return {
    name: shipping.name || "",
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country || "",
  };
};

// Atomically deduct stock; unlimited items (missing/null stock) are skipped.
const decrementStock = async (productId, quantity) => {
  const product = await Product.findOne(
    { _id: productId, isDeleted: false },
    { stock: 1 }
  );

  if (!product) {
    return false;
  }

  if (product.stock === undefined || product.stock === null) {
    return true;
  }

  const result = await Product.updateOne(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } }
  );

  return (result.modifiedCount || 0) > 0;
};

// Put stock back for an order line; unlimited items are left alone.
const restoreStock = async (productId, quantity) => {
  await Product.updateOne(
    { _id: productId, stock: { $gte: 0 } },
    { $inc: { stock: quantity } }
  );
};

// Give back all stock for an order; failures are logged, never blocking.
const restoreStockForOrder = async (order) => {
  const items = order.products || [];

  if (!items.length) {
    return;
  }

  const results = await Promise.allSettled(
    items.map((item) => restoreStock(item.productId, item.quantity))
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Stock restore failed for product ${items[index]?.productId}:`,
        result.reason?.message || result.reason
      );
    }
  });
};

// Create or update the order for a Stripe session (idempotent per payment intent).
const recordOrderFromSession = async (session) => {
  const paymentIntentId = session.payment_intent?.id;

  if (!paymentIntentId) {
    return null;
  }

  const isPaid = session.payment_intent?.status === "succeeded";
  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();

  let order = await Order.findOne({ orderId: paymentIntentId });
  let isNewOrder = false;

  if (!order) {
    const lineItems = (session.line_items?.data || []).map((item) => ({
      productId: item.price.product.metadata.productId,
      quantity: item.quantity,
    }));

    const amount = session.amount_total / 100;

    order = new Order({
      orderId: paymentIntentId,
      products: lineItems,
      amount,
      email,
      shippingAddress: extractShippingAddress(session),
      status: isPaid ? "processing" : "pending",
      statusHistory: [
        {
          status: "pending",
          time: new Date(),
        },
        ...(isPaid ? [{ status: "processing", time: new Date() }] : []),
      ],
    });

    isNewOrder = true;
  } else {
    order.status = isPaid ? "processing" : "pending";
  }

  try {
    await order.save();
  } catch (error) {
    // Webhook + confirm can race — fall back to the saved order.
    if (error?.code === 11000) {
      const existing = await Order.findOne({ orderId: paymentIntentId });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }

  if (isNewOrder) {
    // Only the creator decrements, so webhook + confirm-payment never double-deduct.
    const items = order.products || [];
    const decrements = await Promise.allSettled(
      items.map((item) => decrementStock(item.productId, item.quantity))
    );

    const oversold = decrements.some(
      (result, index) =>
        result.status === "rejected" ||
        items[index] == null ||
        result.value !== true
    );

    if (oversold) {
      // Stock ran out between checkout and payment — undo what we took and cancel.
      await Promise.allSettled(
        decrements.map((result, index) =>
          result.status === "fulfilled" && result.value === true
            ? restoreStock(items[index].productId, items[index].quantity)
            : null
        )
      );

      // They already paid, so refund them.
      if (isPaid) {
        try {
          await getStripe().refunds.create({ payment_intent: paymentIntentId });
        } catch (refundError) {
          console.error(
            `Failed to refund oversold order ${order.orderId}:`,
            refundError.message
          );
        }
      }

      order.status = "canceled";
      order.statusHistory.push({ status: "canceled", time: new Date() });
      order.stockRestored = true;

      await order.save().catch((err) => {
        console.error("Failed to mark oversold order as canceled:", err.message);
      });

      console.error(
        `Order ${order.orderId} canceled — insufficient stock after payment.`
      );
    } else if (isPaid) {
      try {
        // Deterministic job id keeps the webhook and confirm request from both queueing it.
        const queued = await addEmailJob(
          "order-confirmation",
          { to: order.email, orderId: order.orderId, amount: order.amount },
          { jobId: `order-confirmation-${order.orderId}` }
        );

        if (!queued) {
          // Redis down — send inline instead.
          await sendOrderConfirmationEmail({
            to: order.email,
            orderId: order.orderId,
            amount: order.amount,
          });
        }
      } catch (err) {
        console.error("Order confirmation email failed:", err.message);
      }
    }
  }

  return order;
};

// Confirm payment
const confirmPayment = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "payment_intent"],
  });
  const sessionEmail = session.customer_details?.email || session.customer_email;

  if (req.user && req.user.role !== "admin" && sessionEmail !== req.user.email) {
    return res.status(403).json({ message: "You can only confirm your own checkout session." });
  }

  const order = await recordOrderFromSession(session);

  res.status(200).json({ message: "Payment confirmed", order });
});

const markOrderCanceled = async (paymentIntentId) => {
  const order = await Order.findOne({ orderId: paymentIntentId });

  if (!order || order.status === "canceled") {
    return;
  }

  order.status = "canceled";
  order.statusHistory.push({
    status: "canceled",
    time: new Date(),
  });

  // A pending order already took stock, so give it back unless we already did.
  if (!order.stockRestored) {
    await restoreStockForOrder(order);
    order.stockRestored = true;
  }

  await order.save();
};

// Stripe webhook records paid orders (even if the browser closes early) and cancels failed ones.
const stripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const signature = req.headers["stripe-signature"];

  requireEnv([["STRIPE_WEBHOOK_SECRET", config.stripeWebhookSecret]], "Stripe webhook");

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).json({ message: "Webhook signature verification failed." });
  }

  if (event.type === "checkout.session.completed") {
    const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
      expand: ["line_items.data.price.product", "payment_intent"],
    });

    // Only record the order once the payment actually went through.
    if (session.payment_status === "paid" && session.payment_intent?.status === "succeeded") {
      await recordOrderFromSession(session);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    await markOrderCanceled(event.data.object.id);
  }
  // Expired sessions are a no-op — no payment intent, nothing to record.

  res.status(200).json({ received: true });
});

// Get the signed-in user's own orders (email from token, not URL).
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ email: req.user.email, isDeleted: false })
    .populate("products.productId", "name price images isDeleted")
    .sort({ createdAt: -1 });
  res.status(200).json(orders);
});

const getOrdersById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findOne({ _id: id, isDeleted: false })
    .populate("products.productId", "name price images isDeleted");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (req.user.role !== "admin" && order.email !== req.user.email) {
    return res.status(403).json({ message: "You can only view your own orders." });
  }

  res.status(200).json(order);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = "", search = "" } = req.query;
  const numericLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  const filter = { isDeleted: false };

  if (status) {
    filter.status = status;
  }

  if (search && String(search).trim()) {
    filter.email = { $regex: String(search).trim(), $options: "i" };
  }

  const [totalOrders, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .skip((currentPage - 1) * numericLimit)
      .limit(numericLimit)
      .sort({ createdAt: -1 }),
  ]);

  res.status(200).json({
    orders,
    totalOrders,
    totalPages: Math.ceil(totalOrders / numericLimit),
    currentPage,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  if (!ORDER_STATUSES.has(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const lastStatus = order.statusHistory.at(-1)?.status;
  const statusChanged = lastStatus !== status;

  if (statusChanged) {
    order.statusHistory.push({
      status,
      time: new Date(),
    });
  }

  order.status = status;

  // Return stock the first time an order is canceled.
  if (statusChanged && status === "canceled" && !order.stockRestored) {
    await restoreStockForOrder(order);
    order.stockRestored = true;
  }

  await order.save();

  if (statusChanged && ["shipped", "delivered", "canceled"].includes(status)) {
    try {
      const queued = await addEmailJob("order-status", {
        to: order.email,
        orderId: order.orderId,
        status,
      });

      if (!queued) {
        // Redis down — send inline instead.
        await sendOrderStatusEmail({
          to: order.email,
          orderId: order.orderId,
          status,
        });
      }
    } catch (err) {
      console.error("Order status email failed:", err.message);
    }
  }

  res.status(200).json({
    order,
    message: "Order status updated successfully",
  });
});

const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.isDeleted = true;
  await order.save();

  res.status(200).json({
    message: "Order deleted successfully",
    order,
  });
});

module.exports = {
  createCheckoutSession,
  confirmPayment,
  stripeWebhook,
  getMyOrders,
  getOrdersById,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
};
