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
    Product.updateOne.mockResolvedValue({});

    const res = await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(res.status).toBe(200);
    expect(Order.__orders).toHaveLength(1);
    expect(Order.__orders[0].status).toBe("processing");
    expect(Order.__orders[0].shippingAddress.country).toBe("IN");
    expect(Product.updateOne).toHaveBeenCalledWith(
      { _id: "p1", stock: { $exists: true } },
      expect.anything()
    );
  });

  it("is idempotent when the webhook fires twice", async () => {
    const client = getStripeClient();
    client.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_complete" } },
    });
    client.checkout.sessions.retrieve.mockResolvedValue(paidSession);
    Product.updateOne.mockResolvedValue({});

    await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});
    await request(app)
      .post("/api/orders/webhook")
      .set("stripe-signature", "sig")
      .send({});

    expect(Order.__orders).toHaveLength(1);
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
});
