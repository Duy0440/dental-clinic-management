const {
  createChatbotLog,
  checkChatbotUserExists,
} = require("../models/chatbotLogModel");
const { generateDentalReply } = require("../services/chatbotService");
const {
  MAX_PUBLIC_INPUT_LENGTH,
  sanitizePublicInput,
} = require("../utils/publicText");

const getChatbotReply = async (req, res) => {
  try {
    const { message, user_id, history = [] } = req.body;
    const sanitizedMessage = sanitizePublicInput(message);

    if (!sanitizedMessage) {
      return res.status(400).json({
        message: "Vui lòng nhập câu hỏi trước khi gửi.",
      });
    }

    if (String(message).trim().length > MAX_PUBLIC_INPUT_LENGTH) {
      return res.status(400).json({
        message: `Câu hỏi không được vượt quá ${MAX_PUBLIC_INPUT_LENGTH} ký tự.`,
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

    const safeHistory = Array.isArray(history) ? history : [];
    const chatbotResult = await generateDentalReply(sanitizedMessage, safeHistory);

    try {
      await createChatbotLog({
        user_id: user_id || null,
        question: sanitizedMessage,
        answer: chatbotResult.answer,
      });
    } catch (logError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[chatbot] log write failed", logError.name);
      }
    }

    return res.status(200).json({
      message: "Chatbot đã phản hồi thành công.",
      data: {
        answer: chatbotResult.answer,
        sources: chatbotResult.sources,
        confidence: chatbotResult.confidence,
        provider: chatbotResult.provider,
        suggestions: chatbotResult.suggestions,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[chatbot] request failed", error.message);
    }

    return res.status(500).json({
      message: "Chatbot đang tạm gián đoạn. Vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  getChatbotReply,
};
