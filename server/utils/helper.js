const jwt = require("jsonwebtoken");
const { config, requireEnv } = require("../config/env");
const User = require("../models/userModel");

// Cookie lifetime matches the JWT expiry so the cookie never outlives the token.
const EXPIRY_UNIT_MS = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  secs: 1000,
  second: 1000,
  seconds: 1000,
  m: 60 * 1000,
  min: 60 * 1000,
  mins: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  hr: 60 * 60 * 1000,
  hrs: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
  mo: 30 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  months: 30 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
  years: 365 * 24 * 60 * 60 * 1000,
};

// Parse a jsonwebtoken expiresIn value ("7d", "8h", "90m", "3600", "2 days") into ms.
const parseExpiryToMs = (value) => {
  const input = String(value || "").trim().toLowerCase();
  if (!input) return null;

  // Bare numbers mean seconds.
  if (/^\d+(\.\d+)?$/.test(input)) {
    return Math.round(Number(input) * 1000);
  }

  const match = input.match(
    /^(\d+(?:\.\d+)?)\s*(milliseconds?|seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|years?|ms|s|m|h|d|w|mo|y)$/
  );

  if (!match) return null;

  const unitMs = EXPIRY_UNIT_MS[match[2]];
  return unitMs ? Math.round(Number(match[1]) * unitMs) : null;
};

const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const buildCookieOptions = () => {
  const sameSite = String(config.cookie.sameSite || "lax").toLowerCase();
  const secure = config.cookie.secure || sameSite === "none";
  const options = {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: parseExpiryToMs(config.jwtExpires) ?? DEFAULT_MAX_AGE_MS,
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

const generateToken = (user, expiresIn = config.jwtExpires) => {
  requireEnv([["JWT_SECRET", config.jwtSecret]], "authentication");

  const payload = {
    sub: user._id.toString(),
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn,
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

const buildAuthUser = (user) => ({
  sub: user._id.toString(),
  _id: user._id.toString(),
  username: user.username,
  email: user.email,
  role: user.role,
  profilePic: user.profilePic,
});

const getActiveUserFromToken = async (token) => {
  const decoded = decodeToken(token);

  if (!decoded?.sub) {
    return null;
  }

  const user = await User.findOne({ _id: decoded.sub, isDeleted: false })
    .select("_id username email role profilePic passwordChangedAt")
    .lean();

  if (
    user?.passwordChangedAt &&
    decoded.iat &&
    user.passwordChangedAt.getTime() > decoded.iat * 1000
  ) {
    return null;
  }

  return user ? buildAuthUser(user) : null;
};

const verifyToken = async (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    return res.status(401).json({ message: "You need to login to do this action." });
  }

  try {
    const user = await getActiveUserFromToken(token);

    if (!user) {
      return res.status(401).json({ message: "Session expired" });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired" });
  }
};

const optionalVerifyToken = async (req, res, next) => {
  const token = getRequestToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await getActiveUserFromToken(token);
  } catch (err) {
    req.user = null;
  }

  return next();
};

module.exports = {
  generateToken,
  cookieOptions,
  clearCookieOptions,
  parseExpiryToMs,
  optionalVerifyToken,
  verifyToken,
};
