const Joi = require('joi');

const updateUserSchema = Joi.object({
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional(),

  profilePic: Joi.string()
    .uri()
    .allow('')
    .optional(),
  bio: Joi.string()
    .max(500)
    .allow('')
    .optional(),
  profession: Joi.string()
    .max(100)
    .allow('')
    .optional(),
})
.unknown(false) 
.messages({
  'object.unknown': 'Invalid field provided.',
});

// Schema for the avatar/profile upload route (multipart form-data).
// Only the fields the controller accepts are allowed.
const updateUserProfileSchema = Joi.object({
  username: Joi.string()
    .trim()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),

  bio: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .optional(),

  profession: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .optional(),
})
.unknown(false)
.messages({
  'object.unknown': 'Invalid field provided.',
});



 

module.exports = {
  updateUserSchema,
  updateUserProfileSchema,
};
