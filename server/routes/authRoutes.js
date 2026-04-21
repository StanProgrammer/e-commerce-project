// routes/authRoutes.js
const express = require('express');
const validateBody = require('../middlewares/validateBody');
const { registerSchema, loginSchema, googleLoginSchema } = require('../validation/authValidator');
const authCtrls = require('../controllers/authCtrls');
const router = express.Router();
const { verifyToken } = require('../utils/helper');

// GET 
router.get('/', (req, res) => res.send('Auth routes'));

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), authCtrls.register);
router.post('/login', validateBody(loginSchema), authCtrls.login);
router.post('/google', validateBody(googleLoginSchema), authCtrls.googleLogin);

router.get("/me", verifyToken, authCtrls.verifyMe);

router.post('/logout',authCtrls.logout); 
module.exports = router;

