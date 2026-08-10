const request = require("supertest");
const jwt = require("jsonwebtoken");
const buildTestApp = require("./helpers/buildApp");

// All authenticated requests go through verifyToken, which loads the user
// from the DB. Return a fixed admin so the middleware passes.
jest.mock("../models/userModel", () => {
  const adminUser = {
    _id: "admin-id",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    profilePic: "",
  };

  // A Promise that also supports .select()/.lean() chaining like a Mongoose query.
  const createQuery = (data) => {
    let resolveData;
    const query = new Promise((resolve) => {
      resolveData = resolve;
    });
    query.select = () => query;
    query.lean = () => query;
    resolveData(data);
    return query;
  };

  return {
    findOne: jest.fn(() => createQuery(adminUser)),
    exists: jest.fn(async () => null),
  };
});

jest.mock("../models/prdModel", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
}));

jest.mock("../models/orderModel", () => {
  const orders = [];

  class Order {
    constructor(data = {}) {
      Object.assign(this, data);
    }

    async save() {
      // Saving an existing document updates it rather than inserting again,
      // mirroring Mongoose and keeping idempotency assertions meaningful.
      if (!orders.includes(this)) {
        orders.push(this);
      }
      return this;
    }

    static async findOne() {
      return orders[0] || null;
    }

    static async findById() {
      return orders[0] || null;
    }

    static async countDocuments() {
      return orders.length;
    }

    static find() {
      return {
        skip: () => ({ limit: () => ({ sort: () => Promise.resolve([]) }) }),
      };
    }
  }

  Order.__orders = orders;
  return Order;
});

jest.mock("stripe", () => {
  const client = {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  return jest.fn(() => client);
});

const app = buildTestApp();
const Product = require("../models/prdModel");
const Order = require("../models/orderModel");
const stripeModule = require("stripe");

const adminToken = jwt.sign({ sub: "admin-id" }, process.env.JWT_SECRET);
const auth = { Cookie: [`token=${adminToken}`] };

const VALID_OBJECT_ID = "64b1a1a1a1a1a1a1a1a1a1a1";

const getStripeClient = () => stripeModule.mock.results[0]?.value;

beforeEach(() => {
  const client = getStripeClient();
  if (client) {
    client.checkout.sessions.create.mockReset();
    client.checkout.sessions.retrieve.mockReset();
    client.webhooks.constructEvent.mockReset();
  }
  Product.findOne.mockReset();
  Product.updateOne.mockReset();
  Order.__orders.length = 0;
});

describe("POST /api/orders/checkout-session", () => {
  it("rejects quantities that exceed tracked stock", async () => {
    Product.findOne.mockResolvedValueOnce({
      _id: "p1",
      name: "Linen Shirt",
      price: 25,
      images: ["url"],
      stock: 1,
      isDeleted: false,
    });

    const res = await request(app)
      .post("/api/orders/checkout-session")
      .set(auth)
      .send({ products: [{ _id: "p1", quantity: 2 }] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Only 1 left in stock");
  });

  it("creates a Stripe session for in-stock quantities", async () => {
    Product.findOne.mockResolvedValueOnce({
      _id: "p1",
      name: "Linen Shirt",
      price: 25,
      images: ["url"],
      stock: 5,
      isDeleted: false,
    });

    const client = getStripeClient();
    client.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.com/cs_test_1",
    });

    const res = await request(app)
      .post("/api/orders/checkout-session")
      .set(auth)
      .send({ products: [{ _id: "p1", quantity: 2 }] });

    expect(res.status).toBe(200);
    expect(res.body.url).toContain("checkout.stripe.com");

    const createCall = client.checkout.sessions.create.mock.calls[0][0];
    expect(createCall.shipping_address_collection).toBeDefined();
    expect(createCall.line_items[0].quantity).toBe(2);
  });

  it("treats products without stock as unlimited", async () => {
    Product.findOne.mockResolvedValueOnce({
      _id: "p1",
      name: "Linen Shirt",
      price: 25,
      images: ["url"],
      isDeleted: false,
    });

    const client = getStripeClient();
    client.checkout.sessions.create.mockResolvedValue({
      id: "cs_test_2",
      url: "https://checkout.stripe.com/cs_test_2",
    });

    const res = await request(app)
      .post("/api/orders/checkout-session")
      .set(auth)
      .send({ products: [{ _id: "p1", quantity: 99 }] });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/orders/webhook", () => {
  const paidSession = {
    id: "cs_complete",
    payment_intent: { id: "pi_paid_1", status: "succeeded" },
    payment_status: "paid",
    customer_details: { email: "buyer@example.com" },
    amount_total: 5000,
    shipping_details: {
      name: "Jane Doe",
      address: {
        line1: "1 Main St",
        line2: "",
        city: "Pune",
        state: "MH",
        postal_code: "411001",
        country: "IN",
      },
    },
    line_items: {
      data: [
        {
          quantity: 2,
          price: {
            product: { metadata: { productId: "p1" } },
          },
        },
      ],
    },
  };

  it("records an order and decrements stock when payment succeeds", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    Product.findOne.mockResolvedValue({ _id: "p1", stock: 5 });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("processing");
    expect(Order.__orders[0].shippingAddress.country).toBe("IN");
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: "p1", stock: { $gte: 2 } },
      { $inc: { stock: -2 } }
    );
  });

  it("does not cancel orders that contain unlimited-stock products", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    // The product has NO stock field (unlimited): the order must be recorded
    // as paid and must NOT be canceled/refunded, and stock must not be
    // decremented.
    Product.findOne.mockResolvedValue({ _id: "p1" });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("processing");
    expect(Order.__orders[0].stockRestored).not.toBe(true);
    // Unlimited products are never decremented (no stock write happens at all).
    expect(Product.updateOne).not.toHaveBeenCalled();
  });

  it("treats products with null stock as unlimited too", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    Product.findOne.mockResolvedValue({ _id: "p1", stock: null });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("processing");
    expect(Order.__orders[0].stockRestored).not.toBe(true);
    expect(Product.updateOne).not.toHaveBeenCalled();
  });

  it("cancels the order and restores stock when stock is drained before payment", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    // Decrement fails (a concurrent checkout took the last unit); the
    // compensating restore succeeds.
    Product.findOne.mockResolvedValue({ _id: "p1", stock: 1 });
    Product.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
    Product.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("canceled");
    expect(Order.__orders[0].stockRestored).toBe(true);
  });

  it("is idempotent when the webhook fires twice", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    Product.findOne.mockResolvedValue({ _id: "p1", stock: 5 });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});
    await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(Order.__orders).toHaveLength(1);
    expect(Product.updateOne).toHaveBeenCalledTimes(1);
  });

  it("rejects requests with an invalid signature", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "bad-sig")
      .send({});

    expect(res.status).toBe(400);
    expect(Order.__orders).toHaveLength(0);
  });

  it("marks an existing order canceled when the payment fails", async () => {
    Order.__orders.push({
      orderId: "pi_fail_1",
      email: "buyer@example.com",
      status: "pending",
      statusHistory: [{ status: "pending", time: new Date() }],
      save: jest.fn(async function () {
        return this;
      }),
    });

    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: { object: { id: "pi_fail_1" } },
    });

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders[0].status).toBe("canceled");
    expect(
      Order.__orders[0].statusHistory.some((entry) => entry.status === "canceled")
    ).toBe(true);
  });
});

describe("POST /api/orders/confirm-payment", () => {
  const mixedSession = {
    id: "cs_mixed",
    payment_intent: { id: "pi_mixed", status: "succeeded" },
    payment_status: "paid",
    customer_details: { email: "buyer@example.com" },
    amount_total: 5000,
    line_items: {
      data: [
        // Tracked product: stock must be decremented atomically.
        { quantity: 2, price: { product: { metadata: { productId: "p1" } } } },
        // Unlimited product (no stock field): must be skipped, never decremented.
        { quantity: 3, price: { product: { metadata: { productId: "p2" } } } },
      ],
    },
  };

  it("records an order with mixed tracked + unlimited products in one order", async () => {
    const client = getStripeClient();
    client.checkout.sessions.retrieve.mockResolvedValue(mixedSession);
    // decrementStock calls Product.findOne per line item: p1 (tracked, stock 5)
    // first, then p2 (unlimited, no stock field).
    Product.findOne
      .mockResolvedValueOnce({ _id: "p1", stock: 5 })
      .mockResolvedValueOnce({ _id: "p2" });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .post("/api/orders/confirm-payment")
      .set(auth)
      .send({ sessionId: "cs_mixed" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("processing");

    // Both line items end up on the recorded order.
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].products).toEqual([
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 3 },
    ]);

    // Only the tracked product is decremented — exactly one stock write.
    expect(Product.updateOne).toHaveBeenCalledTimes(1);
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: "p1", stock: { $gte: 2 } },
      { $inc: { stock: -2 } }
    );

    // The unlimited product must never trigger a stock write (which would have
    // treated it as oversold and canceled/refunded the whole paid order).
    expect(Product.updateOne).not.toHaveBeenCalledWith(
      { _id: "p2", stock: { $gte: 3 } },
      { $inc: { stock: -3 } }
    );
    expect(Order.__orders[0].stockRestored).not.toBe(true);
    expect(Order.__orders[0].status).toBe("processing");
  });

  it("cancels a mixed order only when the tracked item is oversold", async () => {
    const client = getStripeClient();
    client.checkout.sessions.retrieve.mockResolvedValue(mixedSession);
    // p1 has only 1 unit but 2 were ordered (concurrent checkout drained it),
    // so the tracked decrement fails; p2 is unlimited and succeeds.
    Product.findOne
      .mockResolvedValueOnce({ _id: "p1", stock: 1 })
      .mockResolvedValueOnce({ _id: "p2" });
    Product.updateOne.mockResolvedValueOnce({ modifiedCount: 0 }); // p1 fails
    Product.updateOne.mockResolvedValueOnce({ modifiedCount: 1 }); // p1 restore

    const res = await request(app)
      .post("/api/orders/confirm-payment")
      .set(auth)
      .send({ sessionId: "cs_mixed" });

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("canceled");
    expect(Order.__orders[0].stockRestored).toBe(true);
  });

  it("returns 400 when the session id is missing", async () => {
    const res = await request(app)
      .post("/api/orders/confirm-payment")
      .set(auth)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Session ID is required");
  });
});

describe("PATCH /api/orders/update-order-status/:id", () => {
  it("rejects invalid order ids", async () => {
    const res = await request(app)
      .patch("/api/orders/update-order-status/not-an-id")
      .set(auth)
      .send({ status: "shipped" });

    expect(res.status).toBe(400);
  });

  it("updates the status and records it in history", async () => {
    Order.__orders.push({
      _id: VALID_OBJECT_ID,
      orderId: "pi_status_1",
      email: "buyer@example.com",
      status: "processing",
      statusHistory: [{ status: "processing", time: new Date() }],
      save: jest.fn(async function () {
        return this;
      }),
    });

    const res = await request(app)
      .patch(`/api/orders/update-order-status/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ status: "shipped" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("shipped");
    expect(
      res.body.order.statusHistory.some((entry) => entry.status === "shipped")
    ).toBe(true);
  });

  it("rejects unknown statuses", async () => {
    Order.__orders.push({
      _id: VALID_OBJECT_ID,
      orderId: "pi_status_2",
      email: "buyer@example.com",
      status: "pending",
      statusHistory: [{ status: "pending", time: new Date() }],
      save: jest.fn(async function () {
        return this;
      }),
    });

    const res = await request(app)
      .patch(`/api/orders/update-order-status/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ status: "teleported" });

    expect(res.status).toBe(400);
  });

  it("restores stock once when an order is canceled", async () => {
    Order.__orders.push({
      _id: VALID_OBJECT_ID,
      orderId: "pi_cancel_1",
      email: "buyer@example.com",
      status: "processing",
      products: [{ productId: "p1", quantity: 2 }],
      statusHistory: [{ status: "processing", time: new Date() }],
      save: jest.fn(async function () {
        return this;
      }),
    });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .patch(`/api/orders/update-order-status/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ status: "canceled" });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("canceled");
    expect(res.body.order.stockRestored).toBe(true);
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: "p1", stock: { $gte: 0 } },
      { $inc: { stock: 2 } }
    );
  });

  it("does not restore stock twice for the same order", async () => {
    Order.__orders.push({
      _id: VALID_OBJECT_ID,
      orderId: "pi_cancel_2",
      email: "buyer@example.com",
      status: "processing",
      stockRestored: true,
      products: [{ productId: "p1", quantity: 2 }],
      statusHistory: [{ status: "processing", time: new Date() }],
      save: jest.fn(async function () {
        return this;
      }),
    });
    Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app)
      .patch(`/api/orders/update-order-status/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ status: "canceled" });

    expect(res.status).toBe(200);
    expect(Product.updateOne).not.toHaveBeenCalled();
  });
});
