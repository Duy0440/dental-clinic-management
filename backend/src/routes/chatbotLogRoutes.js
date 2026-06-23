const express = require("express");
const {
  listChatbotLogs,
  addChatbotLog,
} = require("../controllers/chatbotLogController");

const router = express.Router();

router.get("/", listChatbotLogs);
router.post("/", addChatbotLog);

module.exports = router;
