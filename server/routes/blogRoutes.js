const express = require("express");
const router = express.Router();
const blogCtrls = require("../controllers/blogCtrls");
const upload = require("../utils/upload");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const { verifyToken } = require("../utils/helper");
const adminOnly = require("../middlewares/adminOnly");
const {
  createBlogSchema,
  updateBlogSchema,
  blogIdSchema,
  blogQuerySchema,
} = require("../validation/blogValidator");

router.get("/", validateQuery(blogQuerySchema), blogCtrls.getAllBlogs);
router.get(
  "/admin",
  verifyToken,
  adminOnly,
  validateQuery(blogQuerySchema),
  blogCtrls.getAllBlogs
);
router.get("/slug/:slug", blogCtrls.getBlogBySlug);

router.get(
  "/admin/:id",
  verifyToken,
  adminOnly,
  validateParams(blogIdSchema),
  blogCtrls.getBlogById
);

router.post(
  "/create-blog",
  verifyToken,
  adminOnly,
  upload.single("image"),
  validateBody(createBlogSchema),
  blogCtrls.createBlog
);

router.patch(
  "/update-blog/:id",
  verifyToken,
  adminOnly,
  validateParams(blogIdSchema),
  upload.single("image"),
  validateBody(updateBlogSchema),
  blogCtrls.updateBlog
);

router.delete(
  "/delete-blog/:id",
  verifyToken,
  adminOnly,
  validateParams(blogIdSchema),
  blogCtrls.deleteBlog
);

module.exports = router;
