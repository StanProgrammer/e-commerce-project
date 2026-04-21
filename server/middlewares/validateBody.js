module.exports = (schema) => (req, res, next) => {
  const options = {
    abortEarly: false, // return all validation errors 
    allowUnknown: false,
    stripUnknown: true, // remove unknown props
  };

  const { error, value } = schema.validate(req.body, options);
  if (error) {
    const details = error.details.map(d => ({
      message: d.message,
      path: d.path.join('.'),
      type: d.type,
    }));
    return res.status(400).json({ error: 'Validation failed', details });
  }

  req.body = value; 
  next();
};
