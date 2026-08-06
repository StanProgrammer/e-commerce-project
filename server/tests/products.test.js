const request = require("supertest");
const buildTestApp = require("./helpers/buildApp");

jest.mock("../models/prdModel", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

const app = buildTestApp();
const Product = require("../models/prdModel");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validation/productValidator");

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
