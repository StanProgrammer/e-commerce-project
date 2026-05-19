const express = require("express");
const router = express.Router();
const feedbackCtrls = require("../controllers/feedbackCtrls");
const validateBody = require("../middlewares/validateBody");
const { writeLimiter } = require("../middlewares/rateLimiter");
const { optionalVerifyToken, verifyToken } = require("../utils/helper");
const adminOnly = require("../middlewares/adminOnly");
const {
  createFeedbackSchema,
  updateFeedbackStatusSchema,
} = require("../validation/feedbackValidator");

router.get("/me", verifyToken, feedbackCtrls.getMyFeedback);
router.get("/", verifyToken, adminOnly, feedbackCtrls.getAllFeedback);
router.patch(
  "/:id/status",
  writeLimiter,
  verifyToken,
  adminOnly,
  validateBody(updateFeedbackStatusSchema),
  feedbackCtrls.updateFeedbackStatus
);

router.post(
  "/",
  writeLimiter,
  validateBody(createFeedbackSchema),
  optionalVerifyToken,
  feedbackCtrls.createFeedback
);

module.exports = router;
