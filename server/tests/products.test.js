const request = require("supertest");
const jwt = require("jsonwebtoken");
const buildTestApp = require("./helpers/buildApp");

jest.mock("../models/prdModel", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
}));

// verifyToken loads the user from the DB — return a fixed admin.
jest.mock("../models/userModel", () => {
  const adminUser = {
    _id: "admin-id",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    profilePic: "",
  };

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

const app = buildTestApp();
const Product = require("../models/prdModel");
const {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} = require("../validation/productValidator");

const adminToken = jwt.sign({ sub: "admin-id" }, process.env.JWT_SECRET);
const auth = { Cookie: [`token=${adminToken}`] };
const VALID_OBJECT_ID = "64b1a1a1a1a1a1a1a1a1a1a1";

const mockProductQuery = (products) => ({
  skip: () => ({
    limit: () => ({
      populate: () => ({
        sort: () => Promise.resolve(products),
      }),
    }),
  }),
});

beforeEach(() => {
  Product.find.mockReset();
  Product.countDocuments.mockReset();
});

describe("product validators", () => {
  it("treats an empty stock string as absent (form sends stock=\"\")", () => {
    const { error, value } = updateProductSchema.validate({
      name: "Linen Shirt",
      stock: "",
    });

    expect(error).toBeUndefined();
    expect(value.stock).toBeUndefined();
  });

  it("accepts a valid stock count", () => {
    const { error } = createProductSchema.validate({
      name: "Linen Shirt",
      category: "clothes",
      description: "A comfortable everyday linen shirt.",
      price: 25,
      stock: 12,
    });

    expect(error).toBeUndefined();
  });

  it("rejects negative stock", () => {
    const { error } = createProductSchema.validate({
      name: "Linen Shirt",
      category: "clothes",
      description: "A comfortable everyday linen shirt.",
      price: 25,
      stock: -1,
    });

    expect(error).toBeDefined();
  });
});

describe("updateStockSchema", () => {
  it("accepts a whole number of items", () => {
    const { error, value } = updateStockSchema.validate({ stock: 12 });
    expect(error).toBeUndefined();
    expect(value.stock).toBe(12);
  });

  it("accepts zero", () => {
    const { error } = updateStockSchema.validate({ stock: 0 });
    expect(error).toBeUndefined();
  });

  it("accepts null to clear stock tracking", () => {
    const { error, value } = updateStockSchema.validate({ stock: null });
    expect(error).toBeUndefined();
    expect(value.stock).toBeNull();
  });

  it("rejects negative stock", () => {
    const { error } = updateStockSchema.validate({ stock: -1 });
    expect(error).toBeDefined();
  });

  it("rejects fractional stock", () => {
    const { error } = updateStockSchema.validate({ stock: 1.5 });
    expect(error).toBeDefined();
  });

  it("requires the stock field", () => {
    const { error } = updateStockSchema.validate({});
    expect(error).toBeDefined();
  });
});

describe("GET /api/products", () => {
  it("returns paginated product results", async () => {
    const products = [{ _id: "p1", name: "Linen Shirt", price: 20 }];
    Product.find.mockImplementation(() => mockProductQuery(products));
    Product.countDocuments.mockResolvedValue(25);

    const res = await request(app).get("/api/products?page=2&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.totalProducts).toBe(25);
    expect(res.body.totalPages).toBe(5);
    expect(res.body.currentPage).toBe(2);
    expect(Product.countDocuments).toHaveBeenCalledWith({ isDeleted: false });
  });

  it("applies category and price filters to the query", async () => {
    Product.find.mockImplementation(() => mockProductQuery([]));
    Product.countDocuments.mockResolvedValue(3);

    await request(app).get("/api/products?category=clothes&minPrice=10&maxPrice=50");

    expect(Product.countDocuments).toHaveBeenCalledWith({
      isDeleted: false,
      category: "clothes",
      price: { $gte: 10, $lte: 50 },
    });
  });

  it("validates invalid query params", async () => {
    const res = await request(app).get("/api/products?limit=9999");

    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe("string");
  });
});

describe("PATCH /api/products/update-stock/:id", () => {
  beforeEach(() => {
    Product.findOneAndUpdate.mockReset();
  });

  it("updates the stock level", async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Watch",
      stock: 42,
    });

    const res = await request(app)
      .patch(`/api/products/update-stock/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: 42 });

    expect(res.status).toBe(200);
    expect(res.body.product.stock).toBe(42);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      { $set: { stock: 42 } },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  it("clears stock tracking when stock is null", async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Watch",
    });

    const res = await request(app)
      .patch(`/api/products/update-stock/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: null });

    expect(res.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      { $unset: { stock: "" } },
      expect.anything()
    );
  });

  it("rejects negative stock values", async () => {
    const res = await request(app)
      .patch(`/api/products/update-stock/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: -5 });

    expect(res.status).toBe(400);
  });

  it("returns 404 when the product does not exist", async () => {
    Product.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/api/products/update-stock/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: 10 });

    expect(res.status).toBe(404);
  });
});
