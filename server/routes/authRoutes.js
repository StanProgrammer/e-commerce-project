// routes/authRoutes.js
const express = require('express');
const validateBody = require('../middlewares/validateBody');
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validation/authValidator');
const authCtrls = require('../controllers/authCtrls');
const router = express.Router();
const { optionalVerifyToken } = require('../utils/helper');

// GET 
router.get('/', (req, res) => res.send('Auth routes'));

// POST /api/auth/register
router.post('/register', validateBody(registerSchema), authCtrls.register);
router.post('/login', validateBody(loginSchema), authCtrls.login);
router.post('/google', validateBody(googleLoginSchema), authCtrls.googleLogin);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authCtrls.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authCtrls.resetPassword);

router.get("/me", optionalVerifyToken, authCtrls.verifyMe);

router.post('/logout',authCtrls.logout); 
module.exports = router;

