const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isMulterError = err.name === "MulterError" || err.message === "Only image files are allowed.";
  const statusCode = isMulterError
    ? 400
    : res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : 500;
  const isProduction = process.env.NODE_ENV === "production";

  console.error(err.stack || err.message || err);

  return res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = {
  errorHandler,
  notFound,
};
