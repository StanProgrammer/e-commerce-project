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
const { authLimiter, passwordLimiter } = require('../middlewares/rateLimiter');

router.get('/', (req, res) => res.send('Auth routes'));

// Register
router.post('/register', authLimiter, validateBody(registerSchema), authCtrls.register);
router.post('/login', authLimiter, validateBody(loginSchema), authCtrls.login);
router.post('/google', authLimiter, validateBody(googleLoginSchema), authCtrls.googleLogin);
router.post('/forgot-password', passwordLimiter, validateBody(forgotPasswordSchema), authCtrls.forgotPassword);
router.post('/reset-password', passwordLimiter, validateBody(resetPasswordSchema), authCtrls.resetPassword);

router.get("/me", optionalVerifyToken, authCtrls.verifyMe);

router.post('/logout',authCtrls.logout); 
module.exports = router;

