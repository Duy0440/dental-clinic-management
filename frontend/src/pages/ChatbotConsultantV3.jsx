import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../api/axiosClient";

// quick suggestions (cau hoi goi y ban dau)
const defaultSuggestions = [
  "Tôi bị đau răng quá",
  "Răng tôi bị gãy rồi",
  "Răng lung lay sắp rớt",
  "Nướu bị chảy máu là sao?",
  "Hôi miệng xử lý thế nào?",
  "Tôi muốn đặt lịch khám",
];

const quickTopics = [
  { title: "Đau răng", text: "Tôi bị đau răng quá, giờ nên làm gì?" },
  { title: "Gãy / mẻ răng", text: "Răng tôi bị gãy một miếng, có cần đi khám ngay không?" },
  { title: "Răng lung lay", text: "Răng của tôi bị lung lay sắp rớt ra" },
  { title: "Chảy máu nướu", text: "Đánh răng bị chảy máu nướu là bị gì?" },
  { title: "Dịch vụ", text: "Phòng khám có những dịch vụ nha khoa nào?" },
];

const sourceLabels = {
  error: "Hệ thống",
  gemini: "AI tư vấn",
  intro: "Tin nhắn chào",
  rule_based: "Tư vấn nội bộ",
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

// chatbot page (tu van nha khoa va goi api chatbot)
function ChatbotConsultantV3() {
  const user = useMemo(getCurrentUser, []);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [conversation, setConversation] = useState([
    {
      role: "bot",
      text:
        "Chào bạn, mình là trợ lý tư vấn của Nha khoa V. Bạn cứ nhắn như đang hỏi lễ tân nha: đau răng, gãy răng, lung lay, hôi miệng, niềng răng, implant hay cần đặt lịch đều được.",
      source: "intro",
    },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // auto scroll (cuon xuong tin moi)
    const messagesElement = messagesRef.current;

    if (!messagesElement) return;

    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation, loading]);

  const sendQuestion = async (questionText) => {
    // send question (gui cau hoi, nhan cau tra loi)
    const finalQuestion = String(questionText || message).trim();

    if (!finalQuestion || loading) return;

    const history = conversation.slice(-8);
    setConversation((current) => [...current, { role: "user", text: finalQuestion }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/chatbot", {
        message: finalQuestion,
        user_id: user?.id || null,
        history,
      });

      const data = response.data.data || {};

      setConversation((current) => [
        ...current,
        {
          role: "bot",
          text: data.reply || "Mình đã nhận câu hỏi của bạn.",
          source: data.source || "rule_based",
        },
      ]);

      if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      setConversation((current) => [
        ...current,
        {
          role: "bot",
          text:
            error.response?.data?.message ||
            "Chatbot đang tạm lỗi. Bạn thử gửi lại câu hỏi hoặc đặt lịch để phòng khám hỗ trợ trực tiếp nhé.",
          source: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion(message);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendQuestion(message);
    }
  };

  const resetConversation = () => {
    // reset chat (lam moi hoi dap)
    setConversation([
      {
        role: "bot",
        text:
          "Mình đã làm mới cuộc trò chuyện. Bạn mô tả vấn đề răng miệng bằng lời đơn giản thôi, ví dụ: đau răng, gãy răng, sưng nướu, nướu dễ chảy máu hoặc muốn hỏi giá dịch vụ.",
        source: "intro",
      },
    ]);
    setSuggestions(defaultSuggestions);
    setMessage("");
  };

  return (
    <section className="ai-chat-page ai-chat-v3-page">
      <div className="container">
        <div className="ai-chat-v3-hero">
          <span>Hỗ trợ khách hàng</span>
          <h1>Tư vấn nha khoa trực tuyến</h1>
          <p>
            Khách hàng có thể hỏi nhanh về triệu chứng, dịch vụ, chi phí tham khảo và cách đặt lịch.
            Nội dung tư vấn chỉ mang tính tham khảo, không thay thế chẩn đoán trực tiếp của nha sĩ.
          </p>
        </div>

        <div className="ai-chat-v3-layout">
          <aside className="ai-chat-v3-side">
            <div className="ai-chat-v3-brand">
              <div className="ai-chat-v3-orb" aria-hidden="true">
                <span></span>
              </div>
              <div>
                <strong>Nha khoa V Assistant</strong>
                <small>Gợi ý câu hỏi phổ biến</small>
              </div>
            </div>

            <div className="ai-chat-v3-topic-list">
              {quickTopics.map((topic) => (
                <button
                  type="button"
                  key={topic.title}
                  onClick={() => sendQuestion(topic.text)}
                  disabled={loading}
                >
                  <strong>{topic.title}</strong>
                  <span>{topic.text}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="ai-chat-v3-card">
            <div className="ai-chat-v3-header">
              <div>
                <span className="ai-live-dot"></span>
                <strong>Đang sẵn sàng tư vấn</strong>
              </div>
              <button type="button" onClick={resetConversation}>
                Làm mới
              </button>
            </div>

            <div className="ai-chat-v3-messages" ref={messagesRef}>
              {conversation.map((item, index) => (
                <article className={`ai-chat-v3-message ${item.role}`} key={`${item.role}-${index}`}>
                  <div className="ai-chat-v3-avatar">{item.role === "bot" ? "AI" : "KH"}</div>
                  <div className="ai-chat-v3-bubble">
                    {item.text.split("\n\n").map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {item.role === "bot" && item.source === "error" && (
                      <small>{sourceLabels[item.source] || sourceLabels.rule_based}</small>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <article className="ai-chat-v3-message bot">
                  <div className="ai-chat-v3-avatar">AI</div>
                  <div className="ai-chat-v3-bubble ai-chat-v3-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </article>
              )}
            </div>

            <div className="ai-chat-v3-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => sendQuestion(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form className="ai-chat-v3-input" onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi... Ví dụ: răng em bị gãy, đau răng quá, hôi miệng, muốn hỏi giá implant"
                rows="2"
              />
              <button type="submit" disabled={loading || !message.trim()}>
                Gửi
              </button>
            </form>
          </main>
        </div>
      </div>
    </section>
  );
}

export default ChatbotConsultantV3;
