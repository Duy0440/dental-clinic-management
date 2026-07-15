const express = require("express");
const {
  listChatbotLogs,
  addChatbotLog,
} = require("../controllers/chatbotLogController");

const router = express.Router();

// chatbot log routes (luu va xem lich su hoi dap)
router.get("/", listChatbotLogs);
router.post("/", addChatbotLog);

module.exports = router;
