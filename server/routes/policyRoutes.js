const express = require("express");
const router = express.Router();
const policyCtrls = require("../controllers/policyCtrls");
const validateBody = require("../middlewares/validateBody");
const { verifyToken } = require("../utils/helper");
const adminOnly = require("../middlewares/adminOnly");
const { updatePolicySchema } = require("../validation/policyValidator");
const { writeLimiter } = require("../middlewares/rateLimiter");

router.get("/", policyCtrls.getPolicy);

router.patch(
  "/",
  writeLimiter,
  verifyToken,
  adminOnly,
  validateBody(updatePolicySchema),
  policyCtrls.updatePolicy
);

module.exports = router;
