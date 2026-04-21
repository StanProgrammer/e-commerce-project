const express = require('express');
const router = express.Router();

const { verifyToken } = require('../utils/helper');
const userCtrls = require('../controllers/userCtrls');
const validateBody = require('../middlewares/validateBody');
const { updateUserSchema } = require('../validation/userValidator');

// get all users
router.get('/', verifyToken, userCtrls.getAllUsers);



// update user (profile only)
router.patch(
  '/:id',
  verifyToken,
  validateBody(updateUserSchema),
  userCtrls.updateUser
);

module.exports = router;
