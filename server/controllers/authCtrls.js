
const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcryptjs');
const { cookieOptions, generateToken } = require('../utils/helper');

const buildUserResponse = (user) => ({
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
  const { username, email, password, role = 'user', profilePic = '' } = req.body;

  // check duplicates (username OR email)
  const existing = await User.findOne({
    $or: [{ username: username }, { email: email }]
  });

  if (existing) {
    if (existing.username === username) {
      return res.status(409).json({ message: 'Username already in use.' });
    }
    if (existing.email === email) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    return res.status(409).json({ message: 'User already exists.' });
  }

  // hash password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  // create user
  const user = new User({
    username,
    email,
    password: hashed,
    role,
    profilePic,
  });

  await user.save();
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
  const { email, password } = req.body;

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
  // Set cookie
  res.cookie('token', generateToken(user), cookieOptions);

  // Return user info
  return res.json({
    message: 'Logged in',
    user: buildUserResponse(user),
  });
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return res.status(500).json({ message: "Google login is not configured on the server." });
  }

  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const googleRes = await fetch(tokenInfoUrl);
  const googleData = await googleRes.json();

  if (!googleRes.ok) {
    return res.status(401).json({
      message: "Invalid Google credential.",
      details: googleData,
    });
  }

  if (googleData.aud !== googleClientId) {
    return res.status(401).json({ message: "Google credential audience mismatch." });
  }

  if (!googleData.email || googleData.email_verified !== "true") {
    return res.status(401).json({ message: "Google account email is not verified." });
  }

  let user = await User.findOne({ email: googleData.email, isDeleted: false });

  if (!user) {
    const username = await buildUniqueUsername(googleData.name || googleData.email.split("@")[0]);
    const randomPassword = await bcrypt.hash(`${googleData.sub}-${Date.now()}`, 10);

    user = await User.create({
      username,
      email: googleData.email,
      password: randomPassword,
      profilePic: googleData.picture || "",
      role: "user",
    });
  } else if (googleData.picture && user.profilePic !== googleData.picture) {
    user.profilePic = googleData.picture;
    await user.save();
  }

  res.cookie('token', generateToken(user), cookieOptions);

  return res.status(200).json({
    message: "Logged in with Google",
    user: buildUserResponse(user),
  });
});

const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully.' });
}

const verifyMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.sub).select("-password");

  res.status(200).json({
    isAuthenticated: true,
    user,
  });
});

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  verifyMe
};
