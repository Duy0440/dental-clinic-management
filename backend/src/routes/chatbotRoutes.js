const express = require("express");
const { getChatbotReply } = require("../controllers/chatbotController");

const router = express.Router();

// chatbot routes (nhan cau hoi va tra loi tu van)
router.post("/", getChatbotReply);

module.exports = router;
