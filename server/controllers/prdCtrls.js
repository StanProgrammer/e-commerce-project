const Product = require("../models/prdModel.js");
const Review = require("../models/reviewModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const uploadToCloudinary  = require("../utils/uploadImage.js");
const {
  invalidateMany,
  makeKey,
  normalizeQuery,
  readThrough,
  setCacheHeader,
  ttl,
} = require("../utils/cache.js");

const productListPattern = "products:list:*";
const productRelatedPattern = "products:related:*";
const productDetailKey = (id) => makeKey("products", "detail", id);
const productRelatedKey = (id) => makeKey("products", "related", id);

const invalidateProductCache = async (id) =>
  invalidateMany([
    productListPattern,
    productRelatedPattern,
    id ? productDetailKey(id) : null,
  ]);

/* ================= CREATE PRODUCT ================= */
const createProduct = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new Error("No images uploaded");
  }

  // Upload all images
  const imageUrls = await Promise.all(
    req.files.map(async (file) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      return await uploadToCloudinary(base64);
    })
  );
  const savedProduct = await Product.create({...req.body, author: req.user.sub, images: imageUrls});

  const reviews = await Review.find({ productId: savedProduct._id });

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    savedProduct.rating = totalRating / reviews.length;
    await savedProduct.save();
  }

  await invalidateProductCache(savedProduct._id);

  res.status(201).json({
    message: "Product created successfully",
    product: savedProduct,
  });
});

/* ================= GET ALL PRODUCTS ================= */
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    color,
    minPrice,
    maxPrice,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {isDeleted: false};

  if (category && category !== "all") filter.category = category;
  if (color && color !== "all") filter.color = color;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const numericLimit = Number(limit);
  const currentPage = Math.max(Number(page), 1);
  const skip = (currentPage - 1) * numericLimit;

  const cacheKey = makeKey("products", "list", normalizeQuery(req.query));
  const { value, cacheStatus } = await readThrough(
    cacheKey,
    async () => {
      const totalProducts = await Product.countDocuments(filter);

      const products = await Product.find(filter)
        .skip(skip)
        .limit(numericLimit)
        .populate("author", "email")
        .sort({ createdAt: -1 });

      return {
        products,
        totalProducts,
        totalPages: Math.ceil(totalProducts / numericLimit),
        currentPage,
      };
    },
    { ttlSeconds: ttl.productsList }
  );

  setCacheHeader(res, cacheStatus);
  res.status(200).json(value);
});

/* ================= GET SINGLE PRODUCT ================= */
const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { value, cacheStatus } = await readThrough(
    productDetailKey(id),
    async () => {
      const product = await Product.findOne({ _id: id, isDeleted: false }).populate("author", "email");
      if (!product) {
        return null;
      }

      const reviews = await Review.find({ productId: id }).populate(
        "userId",
        "username email"
      );

      return { product, reviews };
    },
    { ttlSeconds: ttl.productDetail }
  );

  if (!value) {
    return res.status(404).json({ message: "Product not found" });
  }

  setCacheHeader(res, cacheStatus);
  res.status(200).json(value);
});

/* ================= UPDATE PRODUCT ================= */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let updateData = { ...req.body };

  let existingImages = [];

  if (req.body.existingImages !== undefined) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch (err) {
      throw new Error("Invalid existingImages format");
    }
  }

  let newImageUrls = [];

  if (req.files && req.files.length > 0) {
    newImageUrls = await Promise.all(
      req.files.map(async (file) => {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
        return await uploadToCloudinary(base64);
      })
    );
  }

  const finalImages = [...existingImages, ...newImageUrls];
  if (
    req.body.existingImages !== undefined ||
    (req.files && req.files.length > 0)
  ) {
    updateData.images = finalImages; // can be []
  }

  delete updateData.existingImages;

  const product = await Product.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await invalidateProductCache(id);

  res.status(200).json({
    message: "Product updated successfully",
    product,
  });
});


/* ================= DELETE PRODUCT ================= */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await invalidateProductCache(id);

  res.status(200).json({ message: "Product deleted successfully" });
});

/* ================= RELATED PRODUCTS ================= */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { value, cacheStatus } = await readThrough(
    productRelatedKey(id),
    async () => {
      const product = await Product.findOne({ _id: id, isDeleted: false }).lean();
      if (!product) {
        return null;
      }

      const keywords = product.name
        .split(" ")
        .filter((word) => word.length > 3)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

      const titleRegex =
        keywords.length > 0 ? new RegExp(keywords.join("|"), "i") : null;

      const query = {
        _id: { $ne: id },
        isDeleted: false,
        $or: titleRegex
          ? [{ category: product.category }, { name: titleRegex }]
          : [{ category: product.category }],
      };

      const relatedProducts = await Product.find(query)
        .select("name price images category rating oldPrice")
        .limit(8)
        .lean();

      return { relatedProducts };
    },
    { ttlSeconds: ttl.relatedProducts }
  );

  if (!value) {
    return res.status(404).json({ message: "Product not found" });
  }

  setCacheHeader(res, cacheStatus);
  res.status(200).json(value);
});

module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  invalidateProductCache,
};
