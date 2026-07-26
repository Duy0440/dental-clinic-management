import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const popularKeywords = [
  "niềng răng",
  "cạo vôi",
  "Trần Văn A",
  "giờ làm việc",
  "đặt lịch",
];

const actionLabels = {
  service: "Đặt lịch tư vấn",
  dentist: "Đặt lịch với nha sĩ",
  faq: "Xem tư vấn",
  clinic: "Xem thông tin",
};

function SearchSmart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("keyword") || "";
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [groups, setGroups] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const normalizedDraft = draftKeyword.trim();
    if (normalizedDraft === keyword.trim()) return undefined;

    const timeoutId = window.setTimeout(() => {
      navigate(
        normalizedDraft
          ? `/search?keyword=${encodeURIComponent(normalizedDraft)}`
          : "/search",
        { replace: true },
      );
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draftKeyword, keyword, navigate]);

  useEffect(() => {
    const query = keyword.trim();
    if (!query) {
      setGroups([]);
      setTotal(0);
      setError("");
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    axiosClient
      .get("/search", {
        params: { q: query },
        signal: controller.signal,
      })
      .then((response) => {
        const data = response.data?.data || {};
        setGroups(Array.isArray(data.groups) ? data.groups : []);
        setTotal(Number(data.total) || 0);
      })
      .catch((requestError) => {
        if (requestError.code === "ERR_CANCELED") return;
        setGroups([]);
        setTotal(0);
        setError(
          requestError.response?.data?.message ||
            "Không thể tải kết quả tìm kiếm. Vui lòng thử lại.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [keyword]);

  const flattenedResults = useMemo(
    () => groups.flatMap((group) => group.items || []),
    [groups],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const query = draftKeyword.trim();
    navigate(query ? `/search?keyword=${encodeURIComponent(query)}` : "/search");
  };

  return (
    <section className="smart-search-page">
      <div className="container">
        <div className="smart-search-hero">
          <span className="smart-search-kicker">Tìm kiếm dữ liệu công khai</span>
          <h1>Tìm dịch vụ, nha sĩ và thông tin phòng khám</h1>
          <p>
            Kết quả được lấy từ dịch vụ và nha sĩ đang hoạt động trong hệ thống,
            cùng nội dung hỏi đáp đã được kiểm duyệt.
          </p>

          <form className="smart-search-form" onSubmit={handleSubmit}>
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="Ví dụ: niềng răng, cạo vôi, Trần Văn A..."
              aria-label="Từ khóa tìm kiếm"
              maxLength="120"
            />
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>

        {!keyword.trim() && (
          <div className="smart-search-suggestions">
            <p>Từ khóa gợi ý:</p>
            <div>
              {popularKeywords.map((item) => (
                <Link key={item} to={`/search?keyword=${encodeURIComponent(item)}`}>
                  {item}
                </Link>
              ))}
            </div>
          </div>
        )}

        {keyword.trim() && (
          <div className="smart-search-summary">
            <div>
              <span>Từ khóa</span>
              <strong>{keyword}</strong>
            </div>
            <div>
              <span>Kết quả phù hợp</span>
              <strong>{loading ? "Đang tìm..." : total}</strong>
            </div>
          </div>
        )}

        {loading && (
          <div className="smart-search-loading" role="status">
            <span aria-hidden="true" />
            Đang tìm trong dữ liệu công khai...
          </div>
        )}

        {error && (
          <div className="smart-search-notice" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && keyword.trim() && total === 0 && (
          <div className="smart-search-empty">
            <h2>Không tìm thấy kết quả phù hợp</h2>
            <p>
              Hãy thử một từ khóa ngắn hơn hoặc hỏi chatbot. Hệ thống không tạo
              kết quả giả khi dữ liệu công khai chưa có nội dung tương ứng.
            </p>
            <Link to="/chatbot">Hỏi chatbot</Link>
          </div>
        )}

        {!loading && !error && flattenedResults.length > 0 && (
          <div className="smart-search-results">
            {groups.map((group) => (
              <section className="smart-search-group" key={group.type}>
                <div className="smart-search-group-heading">
                  <h2>{group.label}</h2>
                  <span>{group.items.length} kết quả</span>
                </div>

                <div className="smart-search-grid">
                  {group.items.map((item) => (
                    <article className="smart-search-card" key={item.id}>
                      <div>
                        <span className="smart-search-type">{group.label}</span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                      <Link to={item.url || "/"}>{actionLabels[item.type] || "Xem chi tiết"}</Link>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchSmart;
