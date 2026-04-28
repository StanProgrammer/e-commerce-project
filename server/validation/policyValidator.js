const Joi = require("joi");

const policySectionSchema = Joi.object({
  _id: Joi.string().length(24).hex().optional(),
  category: Joi.string().valid("buying", "selling", "general").required(),
  title: Joi.string().trim().min(3).max(120).required(),
  content: Joi.string().trim().min(20).max(5000).required(),
  order: Joi.number().integer().min(0).optional(),
});

const updatePolicySchema = Joi.object({
  title: Joi.string().trim().min(3).max(160).required(),
  introduction: Joi.string().trim().min(20).max(2000).required(),
  sections: Joi.array().items(policySectionSchema).min(1).required(),
});

module.exports = {
  updatePolicySchema,
};
