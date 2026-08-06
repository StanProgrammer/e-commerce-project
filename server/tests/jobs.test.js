// Tests for the BullMQ worker processors (server/workers). The processors are
// plain functions that only need a { name, data } job, so no Redis is required.
const emailWorker = require("../workers/emailWorker");
const adminWorker = require("../workers/adminWorker");
const Product = require("../models/prdModel");
const Order = require("../models/orderModel");
const Blog = require("../models/blogModel");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
  sendLowStockAlertEmail,
} = require("../utils/email");

jest.mock("../models/prdModel", () => ({ find: jest.fn() }));
jest.mock("../models/orderModel", () => ({ deleteMany: jest.fn() }));
jest.mock("../models/blogModel", () => ({ deleteMany: jest.fn() }));
jest.mock("../utils/email", () => ({
  sendOrderConfirmationEmail: jest.fn(async () => {}),
  sendOrderStatusEmail: jest.fn(async () => {}),
  sendPasswordResetEmail: jest.fn(async () => {}),
  sendLowStockAlertEmail: jest.fn(async () => {}),
}));

// Mimics a Mongoose query chain that resolves to the given data.
const productQuery = (data) => {
  let resolveData;
  const query = new Promise((resolve) => {
    resolveData = resolve;
  });
  query.select = () => query;
  query.sort = () => query;
  query.limit = () => query;
  resolveData(data);
  return query;
};

const makeJob = (name, data = {}) => ({ name, data });

beforeEach(() => {
  Product.find.mockReset();
  Order.deleteMany.mockReset();
  Blog.deleteMany.mockReset();
  sendOrderConfirmationEmail.mockClear();
  sendOrderStatusEmail.mockClear();
  sendPasswordResetEmail.mockClear();
  sendLowStockAlertEmail.mockClear();
});

describe("emailWorker", () => {
  it("sends order confirmation emails", async () => {
    const data = { to: "buyer@example.com", orderId: "pi_1", amount: 25 };
    await expect(emailWorker(makeJob("order-confirmation", data))).resolves.toEqual({ ok: true });
    expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(data);
  });

  it("sends order status emails", async () => {
    const data = { to: "buyer@example.com", orderId: "pi_1", status: "shipped" };
    await expect(emailWorker(makeJob("order-status", data))).resolves.toEqual({ ok: true });
    expect(sendOrderStatusEmail).toHaveBeenCalledWith(data);
  });

  it("sends password reset emails", async () => {
    const data = { to: "user@example.com", resetUrl: "http://x/reset/abc", username: "user" };
    await expect(emailWorker(makeJob("password-reset", data))).resolves.toEqual({ ok: true });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(data);
  });

  it("rejects unknown job names so BullMQ retries them", async () => {
    await expect(emailWorker(makeJob("nope"))).rejects.toThrow("Unknown email job: nope");
  });

  it("propagates handler failures so BullMQ can retry", async () => {
    sendOrderConfirmationEmail.mockRejectedValueOnce(new Error("SMTP down"));
    await expect(emailWorker(makeJob("order-confirmation"))).rejects.toThrow("SMTP down");
  });
});

describe("adminWorker — low-stock-check", () => {
  it("sends no email when nothing is low on stock", async () => {
    Product.find.mockReturnValueOnce(productQuery([]));

    const result = await adminWorker(makeJob("low-stock-check"));

    expect(result).toEqual({ checked: true, lowStock: 0 });
    expect(sendLowStockAlertEmail).not.toHaveBeenCalled();
  });

  it("emails the store inbox with the low-stock products", async () => {
    const products = [
      { name: "Linen Shirt", category: "shirts", stock: 2, price: 25 },
      { name: "Silk Scarf", category: "accessories", stock: 0, price: 15 },
    ];
    Product.find.mockReturnValueOnce(productQuery(products));

    const result = await adminWorker(makeJob("low-stock-check"));

    expect(result).toEqual({ checked: true, lowStock: 2 });
    expect(sendLowStockAlertEmail).toHaveBeenCalledWith({ products });
  });

  it("uses the threshold from the job data", async () => {
    Product.find.mockReturnValueOnce(productQuery([]));

    await adminWorker(makeJob("low-stock-check", { minStock: 2 }));

    expect(Product.find).toHaveBeenCalledWith({
      isDeleted: false,
      stock: { $exists: true, $lte: 2 },
    });
  });
});

describe("adminWorker — purge-soft-deleted", () => {
  it("hard-deletes soft-deleted orders and blogs older than the cutoff", async () => {
    Order.deleteMany.mockResolvedValueOnce({ deletedCount: 3 });
    Blog.deleteMany.mockResolvedValueOnce({ deletedCount: 1 });

    const result = await adminWorker(makeJob("purge-soft-deleted"));

    expect(result).toEqual({ purgedOrders: 3, purgedBlogs: 1 });
    expect(Order.deleteMany).toHaveBeenCalledWith({
      isDeleted: true,
      updatedAt: { $lt: expect.any(Date) },
    });
    expect(Blog.deleteMany).toHaveBeenCalledWith({
      isDeleted: true,
      updatedAt: { $lt: expect.any(Date) },
    });
  });

  it("rejects unknown admin job names", async () => {
    await expect(adminWorker(makeJob("mystery"))).rejects.toThrow("Unknown admin job: mystery");
  });
});
