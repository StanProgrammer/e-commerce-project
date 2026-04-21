const User = require('../models/userModel');
const asyncHandler = require('../middlewares/asyncHandler');
const mongoose = require('mongoose');

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate user id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user id.' });
  }

  // Prevent admin from demoting themselves
  if (req.user.sub === id) {
    return res.status(400).json({
      message: 'You cannot change your own role.',
    });
  }

  const user = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { role },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.status(200).json({
    message: 'User role updated successfully.',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully.' });

})
module.exports = {
  updateUserRole,
  deleteUser
};
