const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const uploadToCloudinary = require('../utils/uploadImage');

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User
    .find({ isDeleted: false })
    .select('_id email role')
    .sort({ createdAt: -1 });

  res.status(200).json({ users });
});


const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const allowedUpdates = ['username', 'email', 'profilePic', 'bio', 'profession'];
  const updates = {};

  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.status(200).json({
    message: 'User updated successfully.',
    user,
  });
});

const updateUserProfileWithAvatar = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

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

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updates,
    { new: true, runValidators: true }
  );

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
    user: updatedUser,
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
