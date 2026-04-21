const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
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

module.exports = {
  getAllUsers,
  updateUser
};