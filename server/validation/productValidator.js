const Joi = require("joi");
const objectId = Joi.string().length(24).hex();
const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Product name is required.",
    "string.min": "Product name must be at least 3 characters.",
    "string.max": "Product name must not exceed 100 characters.",
  }),

  category: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Category is required.",
  }),

  description: Joi.string().trim().min(10).max(1000).required().messages({
    "string.min": "Description must be at least 10 characters.",
  }),

  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number.",
    "number.positive": "Price must be greater than zero.",
  }),

  oldPrice: Joi.number().positive().precision(2).greater(Joi.ref("price")).optional().messages({
    "number.greater": "Old price must be greater than the current price.",
  }),
  stock: Joi.number().integer().min(0).max(1000000).optional().empty("").messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be a whole number.",
    "number.min": "Stock cannot be negative.",
    "number.max": "Stock cannot exceed 1,000,000.",
  }),
  color: Joi.string().trim().max(30).optional(),

  rating: Joi.number().min(0).max(5).precision(1).optional().messages({
    "number.max": "Rating cannot exceed 5.",
  }),
})
  .unknown(false) // Turn on later to reject unknown fields
  .messages({
    "object.unknown": "Invalid field provided.",
  });



const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  category: Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().trim().min(10).max(1000).optional(),
  price: Joi.number().positive().precision(2).optional(),
  oldPrice: Joi.number().positive().precision(2).optional(),
  stock: Joi.number().integer().min(0).max(1000000).optional().allow(null, "").messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be a whole number.",
    "number.min": "Stock cannot be negative.",
    "number.max": "Stock cannot exceed 1,000,000.",
  }),
  color: Joi.string().trim().max(30).optional(),
  rating: Joi.number().min(0).max(5).precision(1).optional(),

  // allow images (optional)
  images: Joi.array().items(Joi.string().uri()).optional(),

  // allow existingImages from frontend
  existingImages: Joi.string().optional(),
})
.min(1)
.messages({
  'object.min': 'At least one field must be updated',
  'object.unknown': 'Invalid field provided',
});

// Quick stock update: non-negative whole number, or null to clear tracking.
const updateStockSchema = Joi.object({
  stock: Joi.number().integer().min(0).max(1000000).allow(null).required().messages({
    "number.base": "Stock must be a number.",
    "number.integer": "Stock must be a whole number.",
    "number.min": "Stock cannot be negative.",
    "number.max": "Stock cannot exceed 1,000,000.",
    "any.required": "Stock is required.",
  }),
});

const getProductByIdSchema = Joi.object({
  id: objectId.required(),
});


const deleteProductSchema = Joi.object({
  id: objectId.required(),
});


const getAllProductsQuerySchema = Joi.object({
  category: Joi.string().optional(),
  color: Joi.string().optional(),
  search: Joi.string().trim().max(100).optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  getProductByIdSchema,
  deleteProductSchema,
  getAllProductsQuerySchema,
};
