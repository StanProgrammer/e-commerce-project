const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const uploadToCloudinary = require('../utils/uploadImage');
const mongoose = require('mongoose');

const buildUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  profilePic: user.profilePic,
  bio: user.bio,
  profession: user.profession,
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User
    .find({ isDeleted: false })
    .select('_id email role')
    .sort({ createdAt: -1 });

  res.status(200).json({ users });
});


const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  if (req.user.role !== 'admin' && req.user.sub !== String(id)) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }

  const allowedUpdates = ['username', 'email', 'profilePic', 'bio', 'profession'];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (updates.email) {
    const existingEmailUser = await User.findOne({
      _id: { $ne: id },
      email: updates.email,
      isDeleted: false,
    }).select("_id");

    if (existingEmailUser) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
  }

  if (updates.username) {
    const existingUsernameUser = await User.findOne({
      _id: { $ne: id },
      username: updates.username,
      isDeleted: false,
    }).select("_id");

    if (existingUsernameUser) {
      return res.status(409).json({ message: 'Username already in use.' });
    }
  }

  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).select("_id username email role profilePic bio profession");

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.status(200).json({
    message: 'User updated successfully.',
    user: buildUserResponse(user),
  });
});

const updateUserProfileWithAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  if (req.user.role !== 'admin' && req.user.sub !== String(id)) {
    return res.status(403).json({ message: 'You can only update your own profile.' });
  }

  const user = await User.findOne({ _id: id, isDeleted: false });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const updates = {};
  const allowedUpdates = ['username', 'bio', 'profession'];

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  let uploadedAvatar = null;
  const previousProfilePic = user.profilePic;

  if (req.file) {
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    uploadedAvatar = await uploadToCloudinary.uploadResult(base64, {
      folder: 'avatars',
      resource_type: 'image',
    });

    updates.profilePic = uploadedAvatar.secure_url;
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    updates,
    { new: true, runValidators: true }
  ).select("_id username email role profilePic bio profession");

  if (!updatedUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  if (uploadedAvatar && previousProfilePic) {
    try {
      await uploadToCloudinary.delete(previousProfilePic);
    } catch (error) {
      console.error('Previous avatar deletion failed:', error.message);
    }
  }

  res.status(200).json({
    message: 'User profile updated successfully.',
    user: buildUserResponse(updatedUser),
    avatar: uploadedAvatar
      ? {
          url: uploadedAvatar.secure_url,
          publicId: uploadedAvatar.public_id,
        }
      : null,
  });
});

module.exports = {
  getAllUsers,
  updateUser,
  updateUserProfileWithAvatar
};
