const {
  getAllChatbotLogs,
  createChatbotLog,
  checkChatbotUserExists,
} = require("../models/chatbotLogModel");

const listChatbotLogs = async (req, res) => {
  try {
    const logs = await getAllChatbotLogs();

    res.status(200).json({
      message: "Chatbot logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addChatbotLog = async (req, res) => {
  try {
    const { user_id, question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const userExists = await checkChatbotUserExists(user_id);

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const newLog = await createChatbotLog({
      user_id,
      question,
      answer,
    });

    res.status(201).json({
      message: "Chatbot log created successfully",
      data: newLog,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listChatbotLogs,
  addChatbotLog,
};