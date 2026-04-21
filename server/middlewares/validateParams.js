const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.details.map(d => d.message).join(", "),
    });
  }

  req.params = value;
  next();
};

module.exports = validateParams;
