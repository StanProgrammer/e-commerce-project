const jwt = require("jsonwebtoken");
const { config, requireEnv } = require("../config/env");
const User = require("../models/userModel");

const buildCookieOptions = () => {
  const sameSite = String(config.cookie.sameSite || "lax").toLowerCase();
  const secure = config.cookie.secure || sameSite === "none";
  const options = {
    httpOnly: true,
    secure,
    sameSite,
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
    sub: user._id.toString(),
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
  optionalVerifyToken,
  verifyToken,
};
