const express = require('express');
const router = express.Router();
const statsCtrls = require('../controllers/statsCtrls');
const { verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');

router.get('/user-stats/mine', verifyToken, statsCtrls.getMyStats);

//admin-only lookup by email
router.get('/user-stats/:email', verifyToken, adminOnly, statsCtrls.getUserStats);

//admin
router.get('/admin-stats', verifyToken, adminOnly, statsCtrls.getAdminStats);

module.exports = router;
