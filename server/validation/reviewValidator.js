
const Joi = require("joi");

const postReviewSchema = Joi.object({
  comment: Joi.string()
    .trim()
    .min(3)
    .max(500)
    .required()
    .messages({
      "string.empty": "Comment is required.",
      "string.min": "Comment must be at least 3 characters.",
      "string.max": "Comment must not exceed 500 characters.",
    }),

  rating: Joi.number()
    .integer()         
    .min(1)
    .max(5)
    .required()
    .messages({
      "number.base": "Rating must be a number.",
      "number.min": "Rating must be at least 1.",
      "number.max": "Rating cannot exceed 5.",
    }),

  productId: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      "string.length": "Product ID must be a valid ObjectId.",
      "string.hex": "Product ID must be a valid ObjectId.",
    }),
}).unknown(true); 
module.exports = {
  postReviewSchema,
};
