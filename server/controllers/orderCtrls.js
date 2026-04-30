const Order = require("../models/orderModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Product = require("../models/prdModel.js");
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { products,email } = req.body;
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
    success_url: `${process.env.CLIENT_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
  });

  res.status(200).json({
  id: session.id,
  url: session.url,
});

});


//confirm payment 
const confirmPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required" });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price.product", "payment_intent"],
  });

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
  const orders = await Order.find({ email }).sort({ createdAt: -1 });
  res.status(200).json(orders);
});

const getOrdersById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.status(200).json(order);
});

const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: "No orders found" });
  }

  res.status(200).json(orders);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
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

