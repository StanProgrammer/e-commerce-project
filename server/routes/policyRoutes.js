const express = require("express");
const router = express.Router();
const policyCtrls = require("../controllers/policyCtrls");
const validateBody = require("../middlewares/validateBody");
const { verifyToken } = require("../utils/helper");
const adminOnly = require("../middlewares/adminOnly");
const { updatePolicySchema } = require("../validation/policyValidator");

router.get("/", policyCtrls.getPolicy);

router.patch(
  "/",
  verifyToken,
  adminOnly,
  validateBody(updatePolicySchema),
  policyCtrls.updatePolicy
);

module.exports = router;
