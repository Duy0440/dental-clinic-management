import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const defaultSuggestions = [
  "Niềng răng giá bao nhiêu?",
  "Cạo vôi bao nhiêu tiền?",
  "Phòng khám làm việc mấy giờ?",
  "Tôi muốn đặt lịch khám",
];

const quickTopics = [
  { title: "Giá dịch vụ", text: "Niềng răng giá bao nhiêu?" },
  { title: "Giờ làm việc", text: "Phòng khám làm việc mấy giờ?" },
  { title: "Đội ngũ nha sĩ", text: "Bác sĩ Trần Văn A chuyên môn gì?" },
  { title: "Đau răng", text: "Tôi bị đau răng, chắc chắn viêm tủy đúng không?" },
  { title: "Cạo vôi", text: "Cạo vôi răng là gì?" },
];

const confidenceLabels = {
  high: "Thông tin trực tiếp từ nguồn",
  medium: "Tổng hợp từ nguồn liên quan",
  low: "Chưa đủ dữ liệu kiểm chứng",
};

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const introMessage = {
  role: "bot",
  text:
    "Chào bạn, tôi là trợ lý thông tin của Nha khoa V. Tôi sẽ tra cứu dữ liệu đã được kiểm chứng trước khi trả lời về dịch vụ, nha sĩ, giờ làm việc và kiến thức nha khoa cơ bản.",
  sources: [],
  confidence: "high",
};

function ChatbotConsultantV3() {
  const user = useMemo(getCurrentUser, []);
  const messagesRef = useRef(null);
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const [conversation, setConversation] = useState([introMessage]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const messagesElement = messagesRef.current;
    if (!messagesElement) return;

    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation, loading]);

  const sendQuestion = async (questionText) => {
    const finalQuestion = String(questionText || message).trim();
    if (!finalQuestion || loading) return;

    const history = conversation
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));

    setConversation((current) => [
      ...current,
      { role: "user", text: finalQuestion },
    ]);
    setMessage("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/chatbot", {
        message: finalQuestion,
        user_id: user?.id || null,
        history,
      });
      const data = response.data?.data || {};

      setConversation((current) => [
        ...current,
        {
          role: "bot",
          text: data.answer,
          sources: Array.isArray(data.sources) ? data.sources : [],
          confidence: data.confidence || "low",
          feedback: null,
        },
      ]);

      if (Array.isArray(data.suggestions) && data.suggestions.length) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      setConversation((current) => [
        ...current,
        {
          role: "bot",
          text:
            error.response?.data?.message ||
            "Chatbot đang tạm gián đoạn. Vui lòng thử lại.",
          sources: [],
          confidence: "low",
          retryQuestion: finalQuestion,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateFeedback = (messageIndex, feedback) => {
    setConversation((current) =>
      current.map((item, index) =>
        index === messageIndex ? { ...item, feedback } : item,
      ),
    );
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
    setConversation([introMessage]);
    setSuggestions(defaultSuggestions);
    setMessage("");
  };

  return (
    <section className="ai-chat-page ai-chat-v3-page">
      <div className="container">
        <div className="ai-chat-v3-hero">
          <span>Trợ lý tra cứu có nguồn</span>
          <h1>Hỏi đáp nha khoa trực tuyến</h1>
          <p>
            Câu trả lời được giới hạn trong dữ liệu phòng khám và nội dung đã kiểm
            duyệt. Chatbot không chẩn đoán, kê thuốc hoặc thay thế nha sĩ.
          </p>
        </div>

        <div className="ai-chat-v3-layout">
          <aside className="ai-chat-v3-side">
            <div className="ai-chat-v3-brand">
              <div className="ai-chat-v3-orb" aria-hidden="true">
                <span />
              </div>
              <div>
                <strong>Nha khoa V Assistant</strong>
                <small>Gợi ý câu hỏi đã có nguồn</small>
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
                <span className="ai-live-dot" />
                <strong>Sẵn sàng tra cứu</strong>
              </div>
              <button type="button" onClick={resetConversation}>
                Làm mới
              </button>
            </div>

            <div className="ai-chat-v3-messages" ref={messagesRef}>
              {conversation.map((item, index) => (
                <article
                  className={`ai-chat-v3-message ${item.role}`}
                  key={`${item.role}-${index}`}
                >
                  <div className="ai-chat-v3-avatar">
                    {item.role === "bot" ? "AI" : "KH"}
                  </div>
                  <div className="ai-chat-v3-bubble">
                    {String(item.text || "").split("\n\n").map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}

                    {item.role === "bot" && item.sources?.length > 0 && (
                      <div className="ai-chat-v3-sources">
                        <strong>Nguồn đã dùng</strong>
                        <div>
                          {item.sources.map((source) => (
                            <Link to={source.url || "/"} key={source.id}>
                              {source.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.role === "bot" && !item.isError && index > 0 && (
                      <div className="ai-chat-v3-meta">
                        <small>
                          {confidenceLabels[item.confidence] || confidenceLabels.low}
                        </small>
                        <div className="ai-chat-v3-feedback" aria-label="Đánh giá câu trả lời">
                          {item.feedback ? (
                            <span>Cảm ơn phản hồi của bạn.</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => updateFeedback(index, "helpful")}
                              >
                                Hữu ích
                              </button>
                              <button
                                type="button"
                                onClick={() => updateFeedback(index, "inaccurate")}
                              >
                                Chưa chính xác
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {item.retryQuestion && (
                      <button
                        className="ai-chat-v3-retry"
                        type="button"
                        onClick={() => sendQuestion(item.retryQuestion)}
                        disabled={loading}
                      >
                        Thử lại
                      </button>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <article className="ai-chat-v3-message bot" role="status">
                  <div className="ai-chat-v3-avatar">AI</div>
                  <div className="ai-chat-v3-bubble ai-chat-v3-typing">
                    <span />
                    <span />
                    <span />
                    <strong>Đang tìm thông tin...</strong>
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
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi về dịch vụ, nha sĩ hoặc thông tin phòng khám..."
                rows="2"
                maxLength="800"
              />
              <button type="submit" disabled={loading || !message.trim()}>
                Gửi
              </button>
            </form>
            <p className="ai-chat-v3-disclaimer">
              Thông tin chỉ mang tính tham khảo, không thay thế chẩn đoán hoặc chỉ
              định trực tiếp của nha sĩ.
            </p>
          </main>
        </div>
      </div>
    </section>
  );
}

export default ChatbotConsultantV3;
