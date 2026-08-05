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
  color: Joi.string().trim().max(30).optional(),

  rating: Joi.number().min(0).max(5).precision(1).optional().messages({
    "number.max": "Rating cannot exceed 5.",
  }),
  // author: Joi.string().length(24).hex().required().messages({
  //   "string.length": "Author must be a valid ObjectId",
  //   "string.hex": "Author must be a valid ObjectId",
  // }),
})
  .unknown(false) //uncomment this line later to disallow unknown fields
  .messages({
    "object.unknown": "Invalid field provided.",
  });



const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  category: Joi.string().trim().min(2).max(50).optional(),
  description: Joi.string().trim().min(10).max(1000).optional(),
  price: Joi.number().positive().precision(2).optional(),
  oldPrice: Joi.number().positive().precision(2).optional(),
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
  minPrice: Joi.number().positive().optional(),
  maxPrice: Joi.number().positive().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  getAllProductsQuerySchema,
};
