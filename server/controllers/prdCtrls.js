const Product = require("../models/prdModel.js");
const Review = require("../models/reviewModel.js");
const asyncHandler = require("../middlewares/asyncHandler.js");
const uploadToCloudinary  = require("../utils/uploadImage.js");
const { findVariantDuplicate, generateSku } = require("../utils/sku.js");
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

/* Create product */
const createProduct = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new Error("No images uploaded");
  }

  // Reject duplicates: same name + category + color must not appear twice.
  const duplicate = await findVariantDuplicate({
    name: req.body.name,
    category: req.body.category,
    color: req.body.color,
  });
  if (duplicate) {
    return res.status(409).json({
      message: "A product with this name, category and color already exists.",
    });
  }

  // Assign a unique SKU (e.g. WATCH-BLK-001) before persisting.
  const sku = await generateSku(req.body.name, req.body.color);

  // Upload all images
  const imageUrls = await Promise.all(
    req.files.map(async (file) => {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
      return await uploadToCloudinary(base64);
    })
  );

  let savedProduct;
  try {
    savedProduct = await Product.create({...req.body, sku, author: req.user.sub, images: imageUrls});
  } catch (error) {
    // Two concurrent creates could race on the same SKU (unique index).
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "A product with this name, category and color already exists.",
      });
    }
    throw error;
  }

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

/* Get all products */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllProducts = asyncHandler(async (req, res) => {
  const {
    category,
    color,
    minPrice,
    maxPrice,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const filter = {isDeleted: false};

  if (category && category !== "all") filter.category = category;
  if (color && color !== "all") filter.color = color;
  if (search && String(search).trim()) {
    filter.name = { $regex: escapeRegex(String(search).trim()), $options: "i" };
  }

  // Keep a zero floor: 0 is a valid minimum, unlike undefined.
  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== null && minPrice !== "") {
    priceFilter.$gte = Number(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
    priceFilter.$lte = Number(maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    filter.price = priceFilter;
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

/* Get single product */
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

/* Update product */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let updateData = { ...req.body };

  // Empty/null stock from the form means "unlimited": clear tracking.
  const shouldClearStock =
    updateData.stock === "" || updateData.stock === null;
  if (shouldClearStock) {
    delete updateData.stock;
  }

  const existingProduct = await Product.findOne({ _id: id, isDeleted: false });

  if (!existingProduct) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Block renaming into a combo another product already uses.
  if (
    updateData.name !== undefined ||
    updateData.category !== undefined ||
    updateData.color !== undefined
  ) {
    const duplicate = await findVariantDuplicate({
      name: updateData.name ?? existingProduct.name,
      category: updateData.category ?? existingProduct.category,
      color: updateData.color ?? existingProduct.color,
      excludeId: id,
    });

    if (duplicate) {
      return res.status(409).json({
        message: "A product with this name, category and color already exists.",
      });
    }
  }

  // Old products without a SKU get one assigned on their next update.
  if (!existingProduct.sku) {
    updateData.sku = await generateSku(
      updateData.name ?? existingProduct.name,
      updateData.color ?? existingProduct.color
    );
  }

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
  const imagesWereUpdated =
    req.body.existingImages !== undefined ||
    (req.files && req.files.length > 0);

  if (imagesWereUpdated) {
    updateData.images = finalImages; // can be []
  }

  delete updateData.existingImages;

  // Clearing the stock field unsets tracking (same as the update-stock endpoint).
  const update = shouldClearStock
    ? { $unset: { stock: "" }, $set: updateData }
    : updateData;

  const product = await Product.findOneAndUpdate({ _id: id, isDeleted: false }, update, {
    new: true,
    runValidators: true,
  });

  // Remove Cloudinary images dropped in this update (only when the list changed).
  const removedImages = imagesWereUpdated
    ? (existingProduct.images || []).filter(
        (image) => !finalImages.includes(image)
      )
    : [];

  if (removedImages.length > 0) {
    const results = await Promise.allSettled(
      removedImages.map((url) => uploadToCloudinary.delete(url))
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete product image ${removedImages[index]}:`,
          result.reason?.message || result.reason
        );
      }
    });
  }

  await invalidateProductCache(id);

  res.status(200).json({
    message: "Product updated successfully",
    product,
  });
});


/* Update stock */
const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  // null clears stock tracking entirely (product becomes unlimited again).
  const update =
    stock === null
      ? { $unset: { stock: "" } }
      : { $set: { stock } };

  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    update,
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await invalidateProductCache(id);

  res.status(200).json({
    message:
      stock === null
        ? "Stock tracking cleared — product is now unlimited."
        : "Stock updated successfully",
    product,
  });
});

/* Delete product */
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

/* Related products */
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
        .map((word) => escapeRegex(word));

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
  updateStock,
  deleteProduct,
  getRelatedProducts,
  invalidateProductCache,
};
