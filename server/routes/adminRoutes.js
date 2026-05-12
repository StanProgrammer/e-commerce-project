const express = require('express');
const adminCtrls = require('../controllers/adminCtrls');
const router = express.Router();
const adminOnly  = require('../middlewares/adminOnly');
const { verifyToken } = require('../utils/helper');
const validateBody = require('../middlewares/validateBody');
const { updateUserRoleSchema } = require('../validation/adminValidator');
router.patch(
  '/:id',
  verifyToken,
  adminOnly,
  validateBody(updateUserRoleSchema),
  adminCtrls.updateUserRole
);

// delete user (soft delete)
router.delete('/:id', verifyToken, adminOnly, adminCtrls.deleteUser);
module.exports = router;

