const request = require("supertest");
const jwt = require("jsonwebtoken");
const buildTestApp = require("./helpers/buildApp");

jest.mock("../models/prdModel", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
  exists: jest.fn(),
}));

// createProduct uploads to Cloudinary and re-computes the rating from reviews.
jest.mock("../utils/uploadImage", () => {
  const upload = jest.fn(async () => "https://cdn.example/img.jpg");
  upload.delete = jest.fn(async () => ({}));
  upload.uploadResult = jest.fn();
  upload.getPublicIdFromUrl = jest.fn();
  return upload;
});

jest.mock("../models/reviewModel", () => ({
  find: jest.fn(async () => []),
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
  getAllProductsQuerySchema,
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
  Product.exists.mockReset();
  Product.create.mockReset();
  Product.exists.mockResolvedValue(false);
});

describe("product validators", () => {
  it("passes an empty stock string through so the controller can clear tracking", () => {
    const { error, value } = updateProductSchema.validate({
      name: "Linen Shirt",
      stock: "",
    });

    expect(error).toBeUndefined();
    expect(value.stock).toBe("");
  });

  it("accepts null stock on update to clear tracking", () => {
    const { error, value } = updateProductSchema.validate({
      name: "Linen Shirt",
      stock: null,
    });

    expect(error).toBeUndefined();
    expect(value.stock).toBeNull();
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

describe("getAllProductsQuerySchema", () => {
  it("accepts a zero minimum price", () => {
    const { error, value } = getAllProductsQuerySchema.validate({
      minPrice: "0",
      maxPrice: "50",
    });

    expect(error).toBeUndefined();
    expect(value.minPrice).toBe(0);
    expect(value.maxPrice).toBe(50);
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

  it("keeps a zero minimum price in the filter", async () => {
    Product.find.mockImplementation(() => mockProductQuery([]));
    Product.countDocuments.mockResolvedValue(3);

    await request(app).get("/api/products?minPrice=0&maxPrice=50");

    expect(Product.countDocuments).toHaveBeenCalledWith({
      isDeleted: false,
      price: { $gte: 0, $lte: 50 },
    });
  });

  it("validates invalid query params", async () => {
    const res = await request(app).get("/api/products?limit=9999");

    expect(res.status).toBe(400);
    expect(typeof res.body.message).toBe("string");
  });
});

describe("PATCH /api/products/update-product/:id", () => {
  const existingProduct = {
    _id: VALID_OBJECT_ID,
    name: "Linen Shirt",
    sku: "LINEN-SHIRT-001",
    images: ["https://cdn.example/old.jpg"],
    isDeleted: false,
  };

  beforeEach(() => {
    Product.findOne.mockReset();
    Product.findOneAndUpdate.mockReset();
    Product.findOne.mockResolvedValue(existingProduct);
  });

  it("clears stock tracking when the form sends an empty stock field", async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Linen Shirt",
    });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: "" });

    expect(res.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      { $unset: { stock: "" }, $set: {} },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  it("clears stock tracking when stock is null", async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Linen Shirt",
    });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: null });

    expect(res.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      { $unset: { stock: "" }, $set: {} },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  it("updates stock normally when a valid count is provided", async () => {
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Linen Shirt",
      stock: 25,
    });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ stock: 25 });

    expect(res.status).toBe(200);
    expect(res.body.product.stock).toBe(25);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      { stock: 25 },
      expect.objectContaining({ new: true, runValidators: true })
    );
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

describe("POST /api/products/create-product — SKU & uniqueness", () => {
  const baseFields = {
    name: "Watch",
    category: "accessories",
    color: "black",
    description: "A premium analog watch with a leather strap.",
    price: "199.99",
  };

  const createRequest = () =>
    request(app)
      .post("/api/products/create-product")
      .set(auth)
      .field("name", baseFields.name)
      .field("category", baseFields.category)
      .field("color", baseFields.color)
      .field("description", baseFields.description)
      .field("price", baseFields.price)
      .attach("images", Buffer.from("fake-image-bytes"), {
        filename: "watch.png",
        contentType: "image/png",
      });

  beforeEach(() => {
    Product.findOne.mockReset();
    Product.create.mockReset();
    Product.findOne.mockResolvedValue(null);
  });

  it("generates a unique SKU and persists the product", async () => {
    Product.create.mockResolvedValue({
      _id: "p1",
      ...baseFields,
      price: 199.99,
      sku: "WATCH-BLK-001",
      images: ["https://cdn.example/img.jpg"],
    });

    const res = await createRequest();

    expect(res.status).toBe(201);
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "WATCH-BLK-001", name: "Watch" })
    );
  });

  it("rejects a duplicate name + category + color combination", async () => {
    Product.findOne.mockResolvedValue({ _id: "existing", name: "Watch" });

    const res = await createRequest();

    expect(res.status).toBe(409);
    expect(Product.create).not.toHaveBeenCalled();
  });

  it("treats differently-cased / padded names as duplicates", async () => {
    Product.findOne.mockResolvedValue({ _id: "existing", name: "Watch" });

    const res = await request(app)
      .post("/api/products/create-product")
      .set(auth)
      .field("name", "  watch ")
      .field("category", "Accessories")
      .field("color", "Black")
      .field("description", "A premium analog watch with a leather strap.")
      .field("price", "199.99")
      .attach("images", Buffer.from("fake-image-bytes"), {
        filename: "watch.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(409);
    expect(Product.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: { $regex: "^watch$", $options: "i" },
        category: "accessories",
        color: "black",
      })
    );
  });

  it("allows the same name with a different color (a valid variant)", async () => {
    Product.create.mockResolvedValue({
      _id: "p2",
      name: "Watch",
      sku: "WATCH-SLV-001",
      images: ["https://cdn.example/img.jpg"],
    });

    const res = await request(app)
      .post("/api/products/create-product")
      .set(auth)
      .field("name", "Watch")
      .field("category", "accessories")
      .field("color", "silver")
      .field("description", "A premium analog watch with a steel strap.")
      .field("price", "219.99")
      .attach("images", Buffer.from("fake-image-bytes"), {
        filename: "watch.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "WATCH-SLV-001" })
    );
  });

  it("surfaces a friendly 409 when two creates race on the same SKU", async () => {
    Product.create.mockRejectedValue({ code: 11000 });

    const res = await createRequest();

    expect(res.status).toBe(409);
  });
});

describe("PATCH /api/products/update-product/:id — SKU & uniqueness", () => {
  beforeEach(() => {
    Product.findOne.mockReset();
    Product.findOneAndUpdate.mockReset();
    Product.exists.mockReset();
    Product.exists.mockResolvedValue(false);
  });

  it("rejects renaming a product into an existing combination", async () => {
    Product.findOne
      .mockResolvedValueOnce({
        _id: VALID_OBJECT_ID,
        name: "Watch",
        sku: "WATCH-BLK-001",
        isDeleted: false,
      })
      .mockResolvedValueOnce({ _id: "other", name: "Watch" });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ name: "Watch", category: "accessories", color: "black" });

    expect(res.status).toBe(409);
    expect(Product.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("allows keeping the same combination (no false positive for self)", async () => {
    Product.findOne.mockResolvedValueOnce({
      _id: VALID_OBJECT_ID,
      name: "Watch",
      category: "accessories",
      color: "black",
      sku: "WATCH-BLK-001",
      isDeleted: false,
    });
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Watch",
      price: 209.99,
      sku: "WATCH-BLK-001",
    });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ name: "Watch", category: "accessories", color: "black", price: "209.99" });

    expect(res.status).toBe(200);
    // The duplicate check ran and excluded the product itself (no 409).
    expect(Product.findOne).toHaveBeenCalledTimes(2);
  });

  it("back-fills a SKU for a legacy product that has none", async () => {
    Product.findOne.mockResolvedValueOnce({
      _id: VALID_OBJECT_ID,
      name: "Linen Shirt",
      images: ["https://cdn.example/old.jpg"],
      isDeleted: false,
    });
    Product.findOneAndUpdate.mockResolvedValue({
      _id: VALID_OBJECT_ID,
      name: "Linen Shirt",
      price: 30,
      sku: "LINEN-SHIRT-GEN-001",
    });

    const res = await request(app)
      .patch(`/api/products/update-product/${VALID_OBJECT_ID}`)
      .set(auth)
      .send({ price: "30" });

    expect(res.status).toBe(200);
    expect(Product.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: VALID_OBJECT_ID, isDeleted: false },
      expect.objectContaining({ sku: "LINEN-SHIRT-GEN-001", price: 30 }),
      expect.objectContaining({ new: true, runValidators: true })
    );
  });
});
