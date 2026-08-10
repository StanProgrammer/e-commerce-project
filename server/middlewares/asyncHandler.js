module.exports = fn => (req, res, next) => {
  // Returning the promise lets tests await controllers; Express ignores it.
  return Promise.resolve(fn(req, res, next)).catch(next);
};
