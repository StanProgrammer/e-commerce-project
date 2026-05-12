const jwt = require("jsonwebtoken");
const { config, requireEnv } = require("../config/env");

const buildCookieOptions = () => {
  const options = {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  };

  if (config.cookie.domain) {
    options.domain = config.cookie.domain;
  }

  return options;
};

const cookieOptions = {
  ...buildCookieOptions(),
};

const clearCookieOptions = {
  ...cookieOptions,
};
delete clearCookieOptions.maxAge;

const generateToken = (user) => {
  requireEnv([["JWT_SECRET", config.jwtSecret]], "authentication");

  const payload = {
    sub: user._id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpires,
  });
};

const verifyToken = (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "You need to login to do this action." });
  }

  try {
    requireEnv([["JWT_SECRET", config.jwtSecret]], "authentication");
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired" });
  }
};

module.exports = {
  generateToken,
  cookieOptions,
  clearCookieOptions,
  verifyToken,
};
