const Joi = require('joi');

const updateUserRoleSchema = Joi.object({
  role: Joi.string()
    .valid('user', 'admin')
    .required()
    .messages({
      'any.only': 'Role must be either user or admin.',
      'any.required': 'Role is required.',
    }),
});

module.exports = {
  updateUserRoleSchema,
};
