
const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { clearCookieOptions, cookieOptions, generateToken } = require('../utils/helper');
const { config } = require('../config/env');
const { sendPasswordResetEmail } = require('../utils/email');

const PASSWORD_RESET_RESPONSE = "If an account exists for that email, a password reset link has been sent.";

const buildUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  profilePic: user.profilePic,
});

const buildUniqueUsername = async (baseName) => {
  const sanitizedBase = String(baseName || "user")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 20) || "user";

  let username = sanitizedBase;
  let suffix = 1;

  while (await User.exists({ username })) {
    username = `${sanitizedBase}${suffix}`;
    suffix += 1;
  }

  return username;
};

const register = asyncHandler(async (req, res) => {
  // after validateBody, req.body contains sanitized fields only
  const { username, email, password, profilePic = '' } = req.body;

  // check duplicates against ACTIVE accounts (username OR email)
  const activeUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
    isDeleted: false,
  });

  if (activeUser) {
    if (activeUser.username === username) {
      return res.status(409).json({ message: 'Username already in use.' });
    }
    if (activeUser.email === email) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    return res.status(409).json({ message: 'User already exists.' });
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // If a soft-deleted account holds this username/email, reactivate it with
  // the fresh credentials instead of permanently locking the identity.
  const deletedUser = await User.findOne({
    $or: [{ username: username }, { email: email }],
    isDeleted: true,
  });

  if (deletedUser) {
    // Make sure no OTHER deleted account is blocking the new credentials
    // (unique indexes still include soft-deleted documents).
    const blocker = await User.exists({
      _id: { $ne: deletedUser._id },
      isDeleted: true,
      $or: [{ username: username }, { email: email }],
    });

    if (blocker) {
      return res.status(409).json({ message: 'Email or username is already in use.' });
    }

    deletedUser.username = username;
    deletedUser.email = email;
    deletedUser.password = hashed;
    deletedUser.profilePic = profilePic;
    deletedUser.role = 'user';
    deletedUser.bio = '';
    deletedUser.profession = '';
    deletedUser.isDeleted = false;
    deletedUser.googleId = undefined;
    deletedUser.passwordChangedAt = new Date();
    deletedUser.passwordResetToken = undefined;
    deletedUser.passwordResetExpires = undefined;

    try {
      await deletedUser.save();
    } catch (error) {
      // A concurrent registration may have claimed the username/email first.
      if (error?.code === 11000) {
        return res.status(409).json({ message: 'Email or username is already in use.' });
      }
      throw error;
    }

    res.cookie('token', generateToken(deletedUser), cookieOptions);

    return res.status(201).json({
      message: 'User created',
      user: buildUserResponse(deletedUser),
    });
  }

  // create user
  const user = new User({
    username,
    email,
    password: hashed,
    role: 'user',
    profilePic,
  });

  try {
    await user.save();
  } catch (error) {
    // A concurrent registration may have claimed the username/email first.
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Email or username is already in use.' });
    }
    throw error;
  }
  // Set cookie
  res.cookie('token', generateToken(user), cookieOptions);

  // return minimal user info
  return res.status(201).json({
    message: 'User created',
    user: buildUserResponse(user),
  });
}
)
// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password, remember = false } = req.body;

  // Find user 
  const user = await User.findOne({ email,isDeleted: false });
  if (!user || user.isDeleted) {
    //generic message
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  // Set cookie (30 days when "remember me" is checked, otherwise the default
  // lifetime derived from config.jwtExpires).
  const expiresIn = remember ? "30d" : config.jwtExpires;
  const maxAge = remember
    ? 1000 * 60 * 60 * 24 * 30
    : cookieOptions.maxAge;

  res.cookie("token", generateToken(user, expiresIn), {
    ...cookieOptions,
    maxAge,
  });

  // Return user info
  return res.json({
    message: 'Logged in',
    user: buildUserResponse(user),
  });
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const googleClientId = config.googleClientId;

  if (!googleClientId) {
    return res.status(500).json({ message: "Google login is not configured on the server." });
  }

  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const googleRes = await fetch(tokenInfoUrl);
  const googleData = await googleRes.json();

  if (!googleRes.ok) {
    return res.status(401).json({
      message: "Invalid Google credential.",
    });
  }

  if (googleData.aud !== googleClientId) {
    return res.status(401).json({ message: "Google credential audience mismatch." });
  }

  if (!googleData.email || googleData.email_verified !== "true") {
    return res.status(401).json({ message: "Google account email is not verified." });
  }

  const googleEmail = googleData.email.toLowerCase();
  const [googleUser, emailUser] = await Promise.all([
    User.findOne({ googleId: googleData.sub, isDeleted: false }),
    User.findOne({ email: googleEmail }),
  ]);

  if (emailUser?.isDeleted) {
    return res.status(403).json({ message: "This account is no longer active." });
  }

  if (emailUser?.googleId && emailUser.googleId !== googleData.sub) {
    return res.status(409).json({
      message: "This email is already linked to another Google account.",
    });
  }

  if (googleUser && emailUser && !googleUser._id.equals(emailUser._id)) {
    return res.status(409).json({
      message: "This Google account is already linked to another user.",
    });
  }

  let user = googleUser || emailUser;

  if (!user) {
    const username = await buildUniqueUsername(googleData.name || googleData.email.split("@")[0]);
    const randomPassword = await bcrypt.hash(`${googleData.sub}-${Date.now()}`, 10);

    user = await User.create({
      username,
      email: googleEmail,
      googleId: googleData.sub,
      password: randomPassword,
      profilePic: googleData.picture || "",
      role: "user",
    });
  } else {
    let shouldSaveUser = false;

    if (!user.googleId) {
      user.googleId = googleData.sub;
      shouldSaveUser = true;
    }

    if (googleData.picture && user.profilePic !== googleData.picture) {
      user.profilePic = googleData.picture;
      shouldSaveUser = true;
    }

    if (shouldSaveUser) {
      await user.save();
    }
  }

  res.cookie('token', generateToken(user), cookieOptions);

  return res.status(200).json({
    message: "Logged in with Google",
    user: buildUserResponse(user),
  });
});

const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email, isDeleted: false });

  if (!user) {
    return res.status(200).json({ message: PASSWORD_RESET_RESPONSE });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = hashResetToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${config.passwordResetClientUrl}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      username: user.username,
    });

    return res.status(200).json({ message: PASSWORD_RESET_RESPONSE });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error("Password reset email failed:", err.message);

    return res.status(err.responseCode || 500).json({
      message: "We could not send a reset email right now. Please try again later.",
    });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const passwordResetToken = hashResetToken(token);

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() },
    isDeleted: false,
  });

  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired." });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.clearCookie('token', clearCookieOptions);

  return res.status(200).json({ message: "Password updated successfully. You can now sign in." });
});

const logout = (req, res) => {
  res.clearCookie('token', clearCookieOptions);
  return res.status(200).json({ message: 'Logged out successfully.' });
}

const verifyMe = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(200).json({
      isAuthenticated: false,
      user: null,
    });
  }

  const user = await User.findOne({ _id: req.user.sub, isDeleted: false })
    .select("_id username email role profilePic")
    .lean();

  if (!user) {
    return res.status(200).json({
      isAuthenticated: false,
      user: null,
    });
  }

  return res.status(200).json({
    isAuthenticated: true,
    user: buildUserResponse(user),
  });
});

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout,
  verifyMe
};
