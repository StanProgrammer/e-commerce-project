const Joi = require("joi");

const objectId = Joi.string().length(24).hex();

const createBlogSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  subtitle: Joi.string().trim().min(2).max(80).required(),
  slug: Joi.string().trim().lowercase().max(180).optional().allow(""),
  excerpt: Joi.string().trim().min(10).max(300).required(),
  content: Joi.string().trim().min(50).max(10000).required(),
  imageUrl: Joi.string().trim().uri().optional().allow(""),
  publishedAt: Joi.date().optional(),
  isPublished: Joi.boolean().truthy("true").falsy("false").optional(),
});

const updateBlogSchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).optional(),
  subtitle: Joi.string().trim().min(2).max(80).optional(),
  slug: Joi.string().trim().lowercase().max(180).optional().allow(""),
  excerpt: Joi.string().trim().min(10).max(300).optional(),
  content: Joi.string().trim().min(50).max(10000).optional(),
  imageUrl: Joi.string().trim().uri().optional().allow(""),
  publishedAt: Joi.date().optional(),
  isPublished: Joi.boolean().truthy("true").falsy("false").optional(),
}).min(1);

const blogIdSchema = Joi.object({
  id: objectId.required(),
});

const blogQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  includeDrafts: Joi.boolean().truthy("true").falsy("false").optional(),
});

module.exports = {
  createBlogSchema,
  updateBlogSchema,
  blogIdSchema,
  blogQuerySchema,
};
