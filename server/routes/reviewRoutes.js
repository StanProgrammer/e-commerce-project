const express = require("express");
const router = express.Router();
const reviewCtrls = require("../controllers/reviewCtrls");
const validateBody = require("../middlewares/validateBody");
const validateParams = require("../middlewares/validateParams");
const validateQuery = require("../middlewares/validateQuery");
const { postReviewSchema } = require("../validation/reviewValidator");
const { verifyToken } = require("../utils/helper");

//post a review
router.post("/post-review", validateBody(postReviewSchema), verifyToken, reviewCtrls.postReview);

//total reviews for a product
router.get("/total-reviews", reviewCtrls.getTotalReviews);

//get reviews by user
router.get(
  "/:userId",
  // validateParams,
  verifyToken,
  reviewCtrls.getUserReviews,
);

module.exports = router;
