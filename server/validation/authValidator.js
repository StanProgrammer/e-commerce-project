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
  password: Joi.string().min(6).max(128).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.empty': 'Password is required'
    }),
  // optional client-sent fields (will be stripped if you use stripUnknown)
  role: Joi.string().valid('user', 'admin').optional(),
  profilePic: Joi.string().uri().optional().allow(''),
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

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
};
