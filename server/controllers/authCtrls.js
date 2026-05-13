
const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { clearCookieOptions, cookieOptions, generateToken } = require('../utils/helper');
const { config } = require('../config/env');

const PASSWORD_SUPPORT_RESPONSE = "Your request has been sent. Our support team will contact you shortly.";

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

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendPasswordSupportEmail = async ({ email, phone }) => {
  const apiKey = config.resendApiKey;
  const to = config.contactToEmail || "atibkhan392@outlook.com";
  const from = config.contactFromEmail || "onboarding@resend.dev";

  if (!apiKey) {
    const error = new Error("Email service is not configured yet.");
    error.responseCode = 500;
    throw error;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 16px;">Password assistance request</h2>
      <p>A customer requested help recovering access to their account.</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
    </div>
  `;

  const text = [
    "Password assistance request",
    "",
    "A customer requested help recovering access to their account.",
    `Email: ${email}`,
    `Phone: ${phone}`,
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: "Password assistance request",
      html,
      text,
    }),
  });

  const result = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    const error = new Error(result?.message || "Failed to notify support team.");
    error.responseCode = resendResponse.status;
    error.response = result;
    throw error;
  }

  return result;
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
      details: googleData,
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
  const { email, phone } = req.body;

  try {
    await sendPasswordSupportEmail({ email, phone });

    return res.status(200).json({ message: PASSWORD_SUPPORT_RESPONSE });
  } catch (err) {
    console.error("Password assistance email failed:", {
      responseCode: err.responseCode,
      response: err.response,
      message: err.message,
    });

    return res.status(err.responseCode || 500).json({
      message: "We could not notify support right now. Please try again later.",
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

  const user = await User.findById(req.user.sub).select("-password");

  if (!user || user.isDeleted) {
    return res.status(200).json({
      isAuthenticated: false,
      user: null,
    });
  }

  return res.status(200).json({
    isAuthenticated: true,
    user,
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
