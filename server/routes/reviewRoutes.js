const express = require("express");
const router = express.Router();
const reviewCtrls = require("../controllers/reviewCtrls");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const { postReviewSchema } = require("../validation/reviewValidator");
const { verifyToken } = require("../utils/helper");
const { writeLimiter } = require("../middlewares/rateLimiter");

// Post a review
router.post("/post-review", writeLimiter, validateBody(postReviewSchema), verifyToken, reviewCtrls.postReview);

// Total reviews for a product
router.get("/total-reviews", reviewCtrls.getTotalReviews);

// Get reviews by user
router.get(
  "/:userId",
  verifyToken,
  reviewCtrls.getUserReviews,
);

module.exports = router;
