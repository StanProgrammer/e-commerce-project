const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    convert: true, // 👈 converts "1" → 1
  });

  if (error) {
    return res.status(400).json({
      message: error.details.map(d => d.message).join(", "),
    });
  }

  req.query = value;
  next();
};

module.exports = validateQuery;
