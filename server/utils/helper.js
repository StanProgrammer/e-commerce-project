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

const getRequestToken = (req) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  return req.cookies.token || bearerToken;
};

const decodeToken = (token) => {
  requireEnv([["JWT_SECRET", config.jwtSecret]], "authentication");
  return jwt.verify(token, config.jwtSecret);
};

const verifyToken = (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    return res.status(401).json({ message: "You need to login to do this action." });
  }

  try {
    req.user = decodeToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired" });
  }
};

const optionalVerifyToken = (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = decodeToken(token);
  } catch (err) {
    req.user = null;
  }

  return next();
};

module.exports = {
  generateToken,
  cookieOptions,
  clearCookieOptions,
  optionalVerifyToken,
  verifyToken,
};
