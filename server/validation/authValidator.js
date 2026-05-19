const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required()
    .messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must be at most 30 characters'
    }),
  email: Joi.string().trim().lowercase().email().required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.empty': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.empty': 'Password is required',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  profilePic: Joi.string().uri().optional().allow(''),
}).unknown(false).messages({
  'object.unknown': 'Invalid registration field provided.',
});

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

const googleLoginSchema = Joi.object({
  credential: Joi.string().trim().required().messages({
    "string.empty": "Google credential is required",
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required().messages({
    "string.email": "Email must be a valid email address",
    "string.empty": "Email is required",
  }),
  phone: Joi.string()
    .trim()
    .pattern(/^[+()\-\s.\d]{7,20}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Phone number must be valid",
    }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().hex().length(64).required().messages({
    "string.empty": "Reset token is required",
    "string.hex": "Reset token is invalid",
    "string.length": "Reset token is invalid",
  }),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.empty": "Password is required",
      "string.pattern.base": "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
