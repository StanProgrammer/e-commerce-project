const Joi = require("joi");

const contactSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "First name is required.",
    "string.min": "First name must be at least 2 characters.",
    "string.max": "First name must be at most 50 characters.",
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "Last name is required.",
    "string.min": "Last name must be at least 2 characters.",
    "string.max": "Last name must be at most 50 characters.",
  }),
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please enter a valid email address.",
  }),
  subject: Joi.string().trim().min(3).max(120).required().messages({
    "string.empty": "Subject is required.",
    "string.min": "Subject must be at least 3 characters.",
    "string.max": "Subject must be at most 120 characters.",
  }),
  message: Joi.string().trim().min(10).max(2000).required().messages({
    "string.empty": "Message is required.",
    "string.min": "Message must be at least 10 characters.",
    "string.max": "Message must be at most 2000 characters.",
  }),
});

module.exports = {
  contactSchema,
};
