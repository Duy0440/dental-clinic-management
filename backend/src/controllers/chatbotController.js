const {
  createChatbotLog,
  checkChatbotUserExists,
} = require("../models/chatbotLogModel");
const { generateDentalReply } = require("../services/chatbotService");

// chatbot reply (trả lời câu hỏi và lưu lịch sử)
const getChatbotReply = async (req, res) => {
  try {
    const { message, user_id, history = [] } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập câu hỏi trước khi gửi.",
      });
    }

    if (user_id) {
      const userExists = await checkChatbotUserExists(user_id);

      if (!userExists) {
        return res.status(404).json({
          message: "Không tìm thấy tài khoản người dùng.",
        });
      }
    }

    const chatbotResult = await generateDentalReply(message, history);

    await createChatbotLog({
      user_id: user_id || null,
      question: message,
      answer: chatbotResult.answer,
    });

    res.status(200).json({
      message: "Chatbot đã phản hồi thành công.",
      data: {
        reply: chatbotResult.answer,
        source: chatbotResult.source,
        suggestions: chatbotResult.suggestions,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
};

module.exports = {
  getChatbotReply,
};
