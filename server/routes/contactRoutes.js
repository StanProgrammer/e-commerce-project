const express = require("express");
const contactCtrls = require("../controllers/contactCtrls");
const validateBody = require("../middlewares/validateBody");
const { contactSchema } = require("../validation/contactValidator");
const { contactLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/", contactLimiter, validateBody(contactSchema), contactCtrls.sendContactMessage);

module.exports = router;
