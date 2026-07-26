const express = require("express");
const { searchPublic } = require("../controllers/publicSearchController");
const { createPublicRateLimit } = require("../middlewares/publicRateLimit");

const router = express.Router();

router.get("/", createPublicRateLimit({ limit: 40 }), searchPublic);

module.exports = router;
