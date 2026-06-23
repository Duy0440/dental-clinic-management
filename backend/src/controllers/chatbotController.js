const getChatbotReply = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const lowerMessage = message.toLowerCase();
    let reply = "Xin chao. Toi la chatbot nha khoa. Ban vui long dat cau hoi cu the hon.";

    if (lowerMessage.includes("nho rang")) {
      reply = "Nho rang la dich vu kham va lay cao rang dinh ky de giu suc khoe rang mieng tot hon.";
    } else if (lowerMessage.includes("sau rang")) {
      reply = "Sau rang can duoc tham kham som de tranh anh huong den tuy rang va gay dau nhuc.";
    } else if (lowerMessage.includes("dat lich")) {
      reply = "Ban co the dat lich bang cach chon dich vu, nha si, ngay kham va gio kham tren trang Booking.";
    } else if (lowerMessage.includes("gia")) {
      reply = "Ban vui long xem bang gia dich vu trong muc Services de biet chi tiet muc phi.";
    }

    res.json({
      reply,
      note: "Day la chatbot mau don gian. Ban co the nang cap bang OpenAI API hoac Gemini API."
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getChatbotReply
};
