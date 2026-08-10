const express = require('express');
const router = express.Router();
const multer = require('multer');

const { verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');
const userCtrls = require('../controllers/userCtrls');
const validateBody = require('../middlewares/validateBody');
const { updateUserSchema, updateUserProfileSchema } = require('../validation/userValidator');
const { uploadLimiter, writeLimiter } = require('../middlewares/rateLimiter');

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }

    cb(null, true);
  },
});

const uploadAvatar = (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error.message || 'Avatar upload failed.',
      });
    }

    next();
  });
};

// Get all users
router.get('/', verifyToken, adminOnly, userCtrls.getAllUsers);



// Update user (profile only)
router.patch(
  '/:id/profile',
  uploadLimiter,
  verifyToken,
  uploadAvatar,
  validateBody(updateUserProfileSchema),
  userCtrls.updateUserProfileWithAvatar
);

router.patch(
  '/:id',
  writeLimiter,
  verifyToken,
  validateBody(updateUserSchema),
  userCtrls.updateUser
);

module.exports = router;
