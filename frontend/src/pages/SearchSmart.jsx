import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { priceGroups } from "../data/priceData";
import { promotions } from "../data/promotions";

const stopWords = new Set([
  "anh",
  "bao",
  "biet",
  "can",
  "cho",
  "co",
  "cua",
  "em",
  "hoi",
  "kiem",
  "la",
  "minh",
  "muon",
  "tim",
  "toi",
  "tu",
  "van",
  "ve",
  "xem",
]);

const fallbackServices = [
  {
    id: "fallback-implant",
    service_name: "Trồng răng Implant",
    description:
      "Phục hồi răng mất bằng Implant Hàn Quốc, Pháp, Đức, Thụy Sĩ tùy tình trạng xương hàm và kế hoạch phục hình.",
  },
  {
    id: "fallback-orthodontic",
    service_name: "Niềng răng chỉnh nha",
    description:
      "Điều chỉnh răng hô, móm, lệch lạc, sai khớp cắn bằng mắc cài hoặc khay trong.",
  },
  {
    id: "fallback-general",
    service_name: "Nha khoa tổng quát",
    description:
      "Khám, chụp phim, cạo vôi, trám răng, chữa tủy, nhổ răng và chăm sóc răng định kỳ.",
  },
  {
    id: "fallback-porcelain",
    service_name: "Răng sứ thẩm mỹ",
    description:
      "Bọc răng sứ, dán sứ Veneer, phục hình răng vỡ lớn hoặc răng sau chữa tủy.",
  },
  {
    id: "fallback-wisdom",
    service_name: "Nhổ răng khôn",
    description:
      "Khám, chụp phim và tư vấn tiểu phẫu răng khôn mọc lệch, mọc ngầm hoặc gây đau.",
  },
];

const navigationResults = [
  {
    id: "home",
    type: "Trang chủ",
    title: "Trang chủ Nha khoa V",
    description:
      "Xem thông tin phòng khám, dịch vụ nổi bật, cơ sở vật chất, ưu đãi và đặt lịch nhanh.",
    link: "/",
    action: "Về trang chủ",
    keywords: ["trang chu", "nha khoa", "phong kham", "co so vat chat", "gioi thieu"],
  },
  {
    id: "pricing",
    type: "Bảng giá",
    title: "Bảng giá dịch vụ nha khoa",
    description:
      "Tra cứu chi phí tham khảo cho nha khoa tổng quát, Implant, niềng răng, răng sứ và nha khoa trẻ em.",
    link: "/pricing",
    action: "Xem bảng giá",
    keywords: ["gia", "bang gia", "chi phi", "implant", "nieng rang", "rang su"],
  },
  {
    id: "booking",
    type: "Đặt lịch",
    title: "Đặt lịch khám và tư vấn",
    description:
      "Khách vãng lai vẫn có thể đặt lịch, không bắt buộc đăng nhập tài khoản.",
    link: "/booking",
    action: "Đặt lịch",
    keywords: ["dat lich", "hen lich", "kham", "tu van", "khach vang lai"],
  },
  {
    id: "chatbot",
    type: "Hỏi đáp AI",
    title: "Chatbot tư vấn nha khoa",
    description:
      "Hỏi nhanh về triệu chứng, dịch vụ, quy trình điều trị và lưu ý chăm sóc răng miệng.",
    link: "/chatbot",
    action: "Hỏi AI",
    keywords: ["chatbot", "ai", "hoi dap", "dau rang", "tu van nha khoa"],
  },
  {
    id: "account",
    type: "Tài khoản",
    title: "Đăng ký tài khoản khách hàng",
    description:
      "Tạo tài khoản để theo dõi lịch hẹn, kết quả điều trị và đánh giá dịch vụ sau khám.",
    link: "/register",
    action: "Đăng ký",
    keywords: ["dang ky", "dang nhap", "tai khoan", "lich hen", "ket qua dieu tri"],
  },
];

const synonymMap = {
  "bang gia": ["gia", "chi phi", "bao nhieu tien"],
  "chat bot": ["chatbot", "ai", "tu van"],
  "chinh nha": ["nieng rang", "rang ho", "rang mom", "rang lech"],
  "chua tuy": ["lay tuy", "viem tuy", "dieu tri tuy"],
  "cao voi": ["lay cao rang", "ve sinh rang", "chay mau chan rang"],
  "dau rang": ["nhuc rang", "e buot", "sung nuou", "viem tuy"],
  "dat lich": ["hen lich", "kham", "tu van"],
  implant: ["trong rang", "cay ghep", "dentium", "osstem", "straumann", "nobel"],
  "nho rang": ["rang khon", "tieu phau", "nho rang khon"],
  "rang su": ["boc su", "dan su", "veneer", "phuc hinh"],
  "uu dai": ["khuyen mai", "giam gia", "chuong trinh"],
};

const popularKeywords = [
  "implant",
  "niềng răng",
  "bảng giá",
  "đau răng",
  "răng sứ",
  "ưu đãi",
  "đặt lịch",
  "chatbot AI",
];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getExpandedTokens = (keyword) => {
  const normalizedKeyword = normalizeText(keyword);
  const tokens = normalizedKeyword
    .split(" ")
    .filter((token) => token.length >= 2 && !stopWords.has(token));
  const expanded = new Set(tokens);

  Object.entries(synonymMap).forEach(([key, values]) => {
    const normalizedValues = values.map(normalizeText);

    if (
      normalizedKeyword.includes(key) ||
      normalizedValues.some((value) => normalizedKeyword.includes(value))
    ) {
      expanded.add(key);
      normalizedValues.forEach((value) => value.split(" ").forEach((token) => expanded.add(token)));
    }
  });

  return [...expanded].filter((token) => token.length >= 2 && !stopWords.has(token));
};

const buildSearchText = (...values) => values.flat().filter(Boolean).join(" ");

const scoreResult = (keyword, item) => {
  const normalizedKeyword = normalizeText(keyword);
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const keywords = normalizeText(item.keywords?.join(" ") || "");
  const searchable = normalizeText(buildSearchText(item.type, item.title, item.description, item.keywords));
  const tokens = getExpandedTokens(keyword);

  if (!normalizedKeyword) return 0;

  let score = 0;

  if (title === normalizedKeyword) score += 240;
  if (title.includes(normalizedKeyword)) score += 160;
  if (keywords.includes(normalizedKeyword)) score += 135;
  if (searchable.includes(normalizedKeyword)) score += 100;

  tokens.forEach((token) => {
    if (title.includes(token)) score += 30;
    if (keywords.includes(token)) score += 24;
    if (description.includes(token)) score += 14;
    if (searchable.includes(token)) score += 8;
  });

  return score;
};

const createPriceResults = () =>
  priceGroups.flatMap((group, groupIndex) => {
    const groupResult = {
      id: `price-group-${groupIndex}`,
      type: "Bảng giá",
      title: group.title,
      description: group.description,
      link: "/pricing",
      action: "Xem bảng giá",
      keywords: [group.title, group.description, "bang gia", "chi phi", "gia tham khao"],
      priority: 1,
    };

    const rowResults = group.rows.map((row, rowIndex) => ({
      id: `price-row-${groupIndex}-${rowIndex}`,
      type: "Chi phí tham khảo",
      title: row[0],
      description: `${row[1]} - ${row[2]}. Giá thực tế phụ thuộc tình trạng răng và tư vấn của nha sĩ.`,
      link: "/pricing",
      action: "Xem chi tiết",
      keywords: [group.title, row[0], row[1], row[2], "bang gia", "chi phi"],
      priority: 0,
    }));

    return [groupResult, ...rowResults];
  });

function SearchSmart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("keyword") || "";
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [services, setServices] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataNotice, setDataNotice] = useState("");

  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const [serviceResponse, dentistResponse] = await Promise.allSettled([
          axiosClient.get("/services"),
          axiosClient.get("/dentists/active"),
        ]);

        if (serviceResponse.status === "fulfilled") {
          setServices(serviceResponse.value.data.data || []);
        }

        if (dentistResponse.status === "fulfilled") {
          setDentists(dentistResponse.value.data.data || []);
        }

        if (serviceResponse.status === "rejected" || dentistResponse.status === "rejected") {
          setDataNotice("Một phần dữ liệu từ server chưa tải được, hệ thống vẫn tìm trong nội dung công khai của website.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  const allResults = useMemo(() => {
    const serviceSource = services.length ? services : fallbackServices;
    const serviceResults = serviceSource.map((service) => ({
      id: `service-${service.id}`,
      type: "Dịch vụ",
      title: service.service_name,
      description: service.description || "Thông tin dịch vụ đang được cập nhật.",
      link: "/booking",
      action: "Đặt lịch tư vấn",
      keywords: [service.service_name, service.description, "dich vu nha khoa", "dieu tri", "kham"],
      priority: 2,
    }));

    const dentistResults = dentists.map((dentist) => ({
      id: `dentist-${dentist.id}`,
      type: "Nha sĩ",
      title: dentist.full_name,
      description: dentist.specialty || "Thông tin chuyên môn đang được cập nhật.",
      link: "/booking",
      action: "Đặt lịch",
      keywords: [dentist.full_name, dentist.specialty, dentist.email, "bac si", "nha si"],
      priority: 1,
    }));

    const promotionResults = promotions.map((promotion) => ({
      id: `promotion-${promotion.slug}`,
      type: "Ưu đãi",
      title: promotion.title,
      description: promotion.shortDescription,
      link: `/promotions/${promotion.slug}`,
      action: "Xem ưu đãi",
      keywords: [
        promotion.title,
        promotion.category,
        promotion.campaign,
        promotion.badge,
        promotion.highlight,
        "uu dai",
        "khuyen mai",
        "giam gia",
      ],
      priority: 3,
    }));

    return [
      ...navigationResults.map((item) => ({ ...item, priority: 2 })),
      ...promotionResults,
      ...serviceResults,
      ...createPriceResults(),
      ...dentistResults,
    ];
  }, [dentists, services]);

  const matchedResults = useMemo(() => {
    return allResults
      .map((item) => ({
        ...item,
        score: scoreResult(keyword, item) + item.priority,
      }))
      .filter((item) => item.score > 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, 24);
  }, [allResults, keyword]);

  const groupedResults = useMemo(() => {
    return matchedResults.reduce((groups, item) => {
      const groupName = item.type;
      groups[groupName] = groups[groupName] || [];
      groups[groupName].push(item);
      return groups;
    }, {});
  }, [matchedResults]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const finalKeyword = draftKeyword.trim();

    if (finalKeyword) {
      navigate(`/search?keyword=${encodeURIComponent(finalKeyword)}`);
    }
  };

  const hasKeyword = normalizeText(keyword).length > 0;

  return (
    <section className="smart-search-page">
      <div className="container">
        <div className="smart-search-hero">
          <span className="smart-search-kicker">Tìm kiếm trong website</span>
          <h1>Tìm nhanh dịch vụ, bảng giá, ưu đãi và tư vấn nha khoa</h1>
          <p>
            Search mới gom dữ liệu từ trang chủ, bảng giá, chương trình ưu đãi,
            dịch vụ, nha sĩ và chatbot để khách không bị tìm “trật sóng”.
          </p>

          <form className="smart-search-form" onSubmit={handleSubmit}>
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              placeholder="Ví dụ: implant, niềng răng, đau răng, bảng giá..."
            />
            <button type="submit">Tìm kiếm</button>
          </form>
        </div>

        {!hasKeyword && (
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

        {hasKeyword && (
          <div className="smart-search-summary">
            <div>
              <span>Từ khóa</span>
              <strong>{keyword}</strong>
            </div>
            <div>
              <span>Kết quả phù hợp</span>
              <strong>{loading ? "Đang tải..." : matchedResults.length}</strong>
            </div>
          </div>
        )}

        {dataNotice && <div className="smart-search-notice">{dataNotice}</div>}

        {!loading && hasKeyword && matchedResults.length === 0 && (
          <div className="smart-search-empty">
            <h2>Chưa tìm thấy kết quả thật sự khớp</h2>
            <p>
              Bạn thử nhập ngắn hơn như “implant”, “đau răng”, “răng sứ”,
              “bảng giá” hoặc mở chatbot để được hỏi theo kiểu hội thoại.
            </p>
            <Link to="/chatbot">Hỏi chatbot AI</Link>
          </div>
        )}

        {!loading && matchedResults.length > 0 && (
          <div className="smart-search-results">
            {Object.entries(groupedResults).map(([groupName, items]) => (
              <section className="smart-search-group" key={groupName}>
                <div className="smart-search-group-heading">
                  <h2>{groupName}</h2>
                  <span>{items.length} kết quả</span>
                </div>

                <div className="smart-search-grid">
                  {items.map((item) => (
                    <article className="smart-search-card" key={item.id}>
                      <div>
                        <span className="smart-search-type">{item.type}</span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                      <Link to={item.link}>{item.action}</Link>
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
