const Order = require("../models/orderModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const createStripeClient = require("stripe");
const Product = require("../models/prdModel.js");
const { config, requireEnv } = require("../config/env.js");
const mongoose = require("mongoose");

let stripeClient = null;
const ORDER_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "canceled"]);

const getStripe = () => {
  if (!stripeClient) {
    requireEnv([["STRIPE_SECRET_KEY", config.stripeSecretKey]], "Stripe checkout");
    stripeClient = createStripeClient(config.stripeSecretKey);
  }

  return stripeClient;
};

const getCheckoutClientUrl = (req) => {
  const origin = req.get("origin");
  return String(origin || config.clientUrl).replace(/\/+$/g, "");
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
  quantity: item.quantity,
});

}


  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    line_items: lineItems,
    success_url: `${checkoutClientUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${checkoutClientUrl}/shop`,
  });

  res.status(200).json({
  id: session.id,
  url: session.url,
});

});


//confirm payment 
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

  const paymentIntentId = session.payment_intent.id;

  let order = await Order.findOne({ orderId: paymentIntentId });

  if (!order) {
    const lineItems = session.line_items.data.map((item) => ({
      productId: item.price.product.metadata.productId, 
      quantity: item.quantity,
    }));

    const amount = session.amount_total / 100;

    order = new Order({
  orderId: paymentIntentId,
  products: lineItems,
  amount,
  email: session.customer_details.email,
  status:
    session.payment_intent.status === "succeeded"
      ? "processing"
      : "pending",

  statusHistory: [
    {
      status: "pending",
      time: new Date(),
    },
    ...(session.payment_intent.status === "succeeded"
      ? [{ status: "processing", time: new Date() }]
      : []),
  ],
});
  } else {
    order.status =
      session.payment_intent.status === "succeeded"
        ? "processing"
        : "pending";
  }

  await order.save();

  res.status(200).json({ message: "Payment confirmed", order });
});

//get orders by email address
const getOrdersByEmail = asyncHandler(async (req, res) => {
  const { email } = req.params;

  if (req.user.role !== "admin" && email !== req.user.email) {
    return res.status(403).json({ message: "You can only view your own orders." });
  }

  const orders = await Order.find({ email, isDeleted: false })
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
  const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 });
  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: "No orders found" });
  }

  res.status(200).json(orders);
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

  if (lastStatus !== status) {
    order.statusHistory.push({
      status,
      time: new Date(),
    });
  }

  order.status = status;

  await order.save();

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
    getOrdersByEmail,
    getOrdersById,
    getAllOrders,
    updateOrderStatus,
    deleteOrder,
};

