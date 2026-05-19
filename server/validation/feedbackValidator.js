const Joi = require("joi");

const createFeedbackSchema = Joi.object({
  type: Joi.string().valid("bug", "feature").required().messages({
    "any.only": "Feedback type must be either bug or feature.",
    "string.empty": "Feedback type is required.",
  }),
  title: Joi.string().trim().min(3).max(120).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title must be at most 120 characters.",
  }),
  description: Joi.string().trim().min(10).max(3000).required().messages({
    "string.empty": "Description is required.",
    "string.min": "Description must be at least 10 characters.",
    "string.max": "Description must be at most 3000 characters.",
  }),
  pageUrl: Joi.string().trim().uri({ allowRelative: false }).max(1000).allow("").optional(),
});

const updateFeedbackStatusSchema = Joi.object({
  status: Joi.string().valid("new", "in_progress", "resolved", "rejected").required().messages({
    "any.only": "Status must be new, in progress, resolved, or rejected.",
    "any.required": "Status is required.",
    "string.empty": "Status is required.",
  }),
});

module.exports = {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
};
