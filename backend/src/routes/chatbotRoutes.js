const express = require("express");
const { getChatbotReply } = require("../controllers/chatbotController");

const router = express.Router();

router.post("/", getChatbotReply);

module.exports = router;
