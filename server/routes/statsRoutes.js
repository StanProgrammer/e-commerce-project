const express = require('express');
const router = express.Router();
const statsCtrls = require('../controllers/statsCtrls');
const { verifyToken } = require('../utils/helper');

router.get('/user-stats/:email', verifyToken, statsCtrls.getUserStats);

//admin
router.get('/admin-stats', verifyToken, statsCtrls.getAdminStats);

module.exports = router;