const Blog = require("../models/blogModel");
const asyncHandler = require("../middlewares/asyncHandler");
const uploadToCloudinary = require("../utils/uploadImage");
const {
  invalidateMany,
  makeKey,
  normalizeQuery,
  readThrough,
  setCacheHeader,
  ttl,
} = require("../utils/cache");

const slugify = (value) =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const createUniqueSlug = async (title, requestedSlug, currentId) => {
  const baseSlug = slugify(requestedSlug || title);
  let slug = baseSlug;
  let count = 2;

  while (await Blog.findOne({ slug, _id: { $ne: currentId } })) {
    slug = `${baseSlug}-${count}`;
    count += 1;
  }

  return slug;
};

const uploadBlogImage = async (file) => {
  if (!file) return "";

  const base64 = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return uploadToCloudinary(base64);
};

const getAllBlogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, includeDrafts = false } = req.query;
  const currentPage = Math.max(Number(page), 1);
  const numericLimit = Number(limit);
  const skip = (currentPage - 1) * numericLimit;

  const filter = { isDeleted: false };
  if (!includeDrafts || req.user?.role !== "admin") filter.isPublished = true;

  const fetchBlogs = async () => {
    const totalBlogs = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .populate("author", "email username")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(numericLimit);

    return {
      blogs,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / numericLimit),
      currentPage,
    };
  };

  if (includeDrafts && req.user?.role === "admin") {
    return res.status(200).json(await fetchBlogs());
  }

  const { value, cacheStatus } = await readThrough(
    makeKey("blogs", "list", normalizeQuery({ page, limit })),
    fetchBlogs,
    { ttlSeconds: ttl.blogsList }
  );

  setCacheHeader(res, cacheStatus);
  res.status(200).json(value);
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const { value, cacheStatus } = await readThrough(
    makeKey("blogs", "slug", req.params.slug),
    async () => {
      const blog = await Blog.findOne({
        slug: req.params.slug,
        isDeleted: false,
        isPublished: true,
      }).populate("author", "email username");

      return blog ? { blog } : null;
    },
    { ttlSeconds: ttl.blogDetail }
  );

  if (!value) {
    return res.status(404).json({ message: "Blog not found" });
  }

  setCacheHeader(res, cacheStatus);
  res.status(200).json(value);
});

const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findOne({ _id: req.params.id, isDeleted: false }).populate(
    "author",
    "email username"
  );

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  res.status(200).json({ blog });
});

const createBlog = asyncHandler(async (req, res) => {
  const uploadedImageUrl = await uploadBlogImage(req.file);
  const imageUrl = uploadedImageUrl || req.body.imageUrl;

  if (!imageUrl) {
    return res.status(400).json({ message: "Blog image is required" });
  }

  const slug = await createUniqueSlug(req.body.title, req.body.slug);
  const blog = await Blog.create({
    ...req.body,
    slug,
    imageUrl,
    author: req.user.sub,
  });

  await invalidateMany(["blogs:list:*", makeKey("blogs", "slug", blog.slug)]);

  res.status(201).json({
    message: "Blog created successfully",
    blog,
  });
});

const updateBlog = asyncHandler(async (req, res) => {
  const existingBlog = await Blog.findOne({ _id: req.params.id, isDeleted: false });

  if (!existingBlog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  const updateData = { ...req.body };
  const uploadedImageUrl = await uploadBlogImage(req.file);
  if (uploadedImageUrl) updateData.imageUrl = uploadedImageUrl;

  if (updateData.slug || updateData.title) {
    updateData.slug = await createUniqueSlug(
      updateData.title || existingBlog.title,
      updateData.slug || existingBlog.slug,
      existingBlog._id
    );
  }

  const blog = await Blog.findByIdAndUpdate(existingBlog._id, updateData, {
    new: true,
    runValidators: true,
  });

  // Delete the replaced image from Cloudinary (best-effort, never fails the request).
  if (uploadedImageUrl && existingBlog.imageUrl && existingBlog.imageUrl !== uploadedImageUrl) {
    try {
      await uploadToCloudinary.delete(existingBlog.imageUrl);
    } catch (error) {
      console.error("Previous blog image deletion failed:", error.message);
    }
  }

  await invalidateMany([
    "blogs:list:*",
    makeKey("blogs", "slug", existingBlog.slug),
    makeKey("blogs", "slug", blog.slug),
  ]);

  res.status(200).json({
    message: "Blog updated successfully",
    blog,
  });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true }
  );

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  await invalidateMany(["blogs:list:*", makeKey("blogs", "slug", blog.slug)]);

  res.status(200).json({ message: "Blog deleted successfully" });
});

module.exports = {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
};
