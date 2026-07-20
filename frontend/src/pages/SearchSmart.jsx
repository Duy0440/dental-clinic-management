import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { priceGroups } from "../data/priceData";
import { promotions } from "../data/promotions";

// stop words (bo qua tu khong quan trong khi search)
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

const knowledgeResults = [
  {
    id: "knowledge-caries",
    type: "Kiáº¿n thá»©c nha khoa",
    title: "SÃ¢u rÄƒng, viÃªm tá»§y vÃ  trÃ¡m rÄƒng",
    description: "TÃ¬m hiá»ƒu sÃ¢u rÄƒng, Ä‘au rÄƒng, khi nÃ o cáº§n trÃ¡m hoáº·c chá»¯a tá»§y.",
    link: "/chatbot",
    action: "Há»i chatbot",
    keywords: ["sau rang", "dau rang", "viem tuy", "chua tuy", "tram rang", "lo sau"],
  },
  {
    id: "knowledge-gum",
    type: "Kiáº¿n thá»©c nha khoa",
    title: "ViÃªm nÆ°á»›u, nha chu vÃ  cháº£y mÃ¡u chÃ¢n rÄƒng",
    description: "Tra cá»©u nguyÃªn nhÃ¢n sÆ°ng nÆ°á»›u, cháº£y mÃ¡u chÃ¢n rÄƒng, hÃ´i miá»‡ng vÃ  cáº¡o vÃ´i.",
    link: "/chatbot",
    action: "Há»i chatbot",
    keywords: ["viem nuou", "nha chu", "sung nuou", "chay mau chan rang", "hoi mieng", "cao voi"],
  },
  {
    id: "knowledge-restoration",
    type: "Kiáº¿n thá»©c nha khoa",
    title: "Phá»¥c hÃ¬nh rÄƒng: trÃ¡m, inlay/onlay, rÄƒng sá»©, implant",
    description: "So sÃ¡nh cÃ¡c cÃ¡ch phá»¥c há»“i rÄƒng vá»¡, rÄƒng máº¥t hoáº·c rÄƒng yáº¿u sau chá»¯a tá»§y.",
    link: "/chatbot",
    action: "Há»i chatbot",
    keywords: ["phuc hinh", "inlay", "onlay", "veneer", "rang su", "cau rang", "ham thao lap", "implant"],
  },
  {
    id: "knowledge-equipment",
    type: "Thiáº¿t bá»‹",
    title: "CBCT X5, scan Shinning 3D, MELAG 323",
    description: "Xem thiáº¿t bá»‹ há»— trá»£ cháº©n Ä‘oÃ¡n, láº¥y dáº¥u ká»¹ thuáº­t sá»‘ vÃ  kiá»ƒm soÃ¡t vÃ´ trÃ¹ng.",
    link: "/about#about-facilities",
    action: "Xem thiáº¿t bá»‹",
    keywords: ["cbct x5", "hyperion", "scan shinning", "melag", "vacuclave", "class b", "en13060", "runyess"],
  },
  {
    id: "knowledge-facilities",
    type: "CÆ¡ sá»Ÿ váº­t cháº¥t",
    title: "Thiáº¿t bá»‹ vÃ  khÃ´ng gian Ä‘iá»u trá»‹",
    description: "Xem gháº¿ RunTour, CBCT Hyperion X5, scan Shinning 3D vÃ  ná»“i háº¥p MELAG 323 táº¡i Nha khoa V.",
    link: "/about#about-facilities",
    action: "Xem thiáº¿t bá»‹",
    keywords: ["thiet bi nha khoa", "co so vat chat", "cbct", "hyperion x5", "scan shinning", "noi hap melag", "class b", "runyess", "ghe nha khoa", "vo trung"],
  },
];

const cleanKnowledgeResults = [
  {
    id: "knowledge-caries-clean",
    type: "Kiến thức nha khoa",
    title: "Sâu răng, viêm tủy và trám răng",
    description: "Tìm hiểu sâu răng, đau răng, khi nào cần trám hoặc chữa tủy.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["sau rang", "dau rang", "viem tuy", "chua tuy", "tram rang", "lo sau"],
  },
  {
    id: "knowledge-gum-clean",
    type: "Kiến thức nha khoa",
    title: "Viêm nướu, nha chu và chảy máu nướu",
    description: "Tra cứu nguyên nhân sưng nướu, nướu chảy máu khi đánh răng, hôi miệng và cạo vôi.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["viem nuou", "nha chu", "sung nuou", "chay mau chan rang", "hoi mieng", "cao voi"],
  },
  {
    id: "knowledge-restoration-clean",
    type: "Kiến thức nha khoa",
    title: "Phục hình răng: trám, inlay/onlay, răng sứ, implant",
    description: "So sánh các cách phục hồi răng vỡ, răng mất hoặc răng yếu sau chữa tủy.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["phuc hinh", "inlay", "onlay", "veneer", "rang su", "cau rang", "ham thao lap", "implant"],
  },
  {
    id: "knowledge-equipment-clean",
    type: "Thiết bị",
    title: "CBCT X5, scan Shinning 3D, MELAG 323",
    description: "Xem thiết bị hỗ trợ chẩn đoán, lấy dấu kỹ thuật số và kiểm soát vô trùng.",
    link: "/about#about-facilities",
    action: "Xem thiết bị",
    keywords: ["cbct x5", "hyperion", "scan shinning", "melag", "vacuclave", "class b", "en13060", "runyess"],
  },
  {
    id: "knowledge-facilities-clean",
    type: "Cơ sở vật chất",
    title: "Thiết bị và không gian điều trị",
    description: "Xem ghế RunTour, CBCT Hyperion X5, scan Shinning 3D và nồi hấp MELAG 323 tại Nha khoa V.",
    link: "/about#about-facilities",
    action: "Xem thiết bị",
    keywords: ["thiet bi nha khoa", "co so vat chat", "cbct", "hyperion x5", "scan shinning", "noi hap melag", "class b", "runyess", "ghe nha khoa", "vo trung"],
  },
];

const publicKnowledgeResults = [
  {
    id: "knowledge-caries-public",
    type: "Kiến thức nha khoa",
    title: "Sâu răng, viêm tủy và trám răng",
    description: "Tìm hiểu sâu răng, đau răng, khi nào cần trám răng hoặc chữa tủy.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["sau rang", "dau rang", "viem tuy", "chua tuy", "tram rang", "lo sau"],
  },
  {
    id: "knowledge-gum-public",
    type: "Kiến thức nha khoa",
    title: "Viêm nướu, nha chu và chảy máu nướu",
    description: "Tra cứu nguyên nhân sưng nướu, nướu chảy máu khi đánh răng, hôi miệng và cạo vôi.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["viem nuou", "nha chu", "sung nuou", "chay mau chan rang", "hoi mieng", "cao voi"],
  },
  {
    id: "knowledge-restoration-public",
    type: "Kiến thức nha khoa",
    title: "Phục hình răng: trám, inlay/onlay, răng sứ, implant",
    description: "So sánh các cách phục hồi răng vỡ, răng mất hoặc răng yếu sau chữa tủy.",
    link: "/chatbot",
    action: "Hỏi chatbot",
    keywords: ["phuc hinh", "inlay", "onlay", "veneer", "rang su", "cau rang", "ham thao lap", "implant"],
  },
  {
    id: "knowledge-equipment-public",
    type: "Thiết bị",
    title: "CBCT Hyperion X5, scan Shinning 3D, MELAG 323",
    description: "Xem thiết bị hỗ trợ chẩn đoán, lấy dấu kỹ thuật số và kiểm soát vô trùng.",
    link: "/about#about-facilities",
    action: "Xem thiết bị",
    keywords: ["cbct x5", "hyperion", "scan shinning", "melag", "vacuclave", "melag 323", "runyess"],
  },
  {
    id: "knowledge-facilities-public",
    type: "Cơ sở vật chất",
    title: "Thiết bị và không gian điều trị",
    description: "Xem ghế RunTour, CBCT Hyperion X5, scan Shinning 3D và nồi hấp MELAG 323 tại Nha khoa V.",
    link: "/about#about-facilities",
    action: "Xem thiết bị",
    keywords: ["thiet bi nha khoa", "co so vat chat", "cbct", "hyperion x5", "scan shinning", "noi hap melag", "runyess", "ghe nha khoa", "vo trung"],
  },
];

// synonym map (mo rong tu khoa co dau/khong dau/viet tat)
const synonymMap = {
  "bang gia": ["gia", "chi phi", "bao nhieu tien"],
  "chat bot": ["chatbot", "ai", "tu van"],
  "chinh nha": ["nieng rang", "rang ho", "rang mom", "rang lech"],
  "chua tuy": ["lay tuy", "viem tuy", "dieu tri tuy"],
  "cao voi": ["lay cao rang", "ve sinh rang", "chay mau chan rang"],
  "dau rang": ["nhuc rang", "e buot", "sung nuou", "viem tuy"],
  "dat lich": ["hen lich", "kham", "tu van"],
  implant: ["trong rang", "cay ghep", "dio", "sic", "tru implant"],
  "nho rang": ["rang khon", "tieu phau", "nho rang khon"],
  "rang su": ["boc su", "dan su", "veneer", "phuc hinh"],
  "thiet bi": ["co so vat chat", "may moc nha khoa", "cbct", "hyperion x5", "scan shinning", "melag", "runyess"],
  cbct: ["hyperion x5", "chup phim 3d", "phim 3d", "ceph"],
  scan: ["shinning", "shining", "lay dau ky thuat so", "lay dau so"],
  "noi hap": ["melag", "vacuclave", "class b", "en13060", "vo trung", "tiet trung"],
  "ghe nha khoa": ["runyess", "ghe dieu tri"],
  "viem nuou": ["sung nuou", "chay mau chan rang", "nha chu", "viem loi"],
  "phuc hinh": ["cau rang", "ham thao lap", "inlay", "onlay", "veneer", "implant"],
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

// normalize text (dua ve khong dau de tim kiem de hon)
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

const isDoctorIntent = (keyword) =>
  hasAnyToken(keyword, ["bac si", "nha si", "doctor", "bs", "bsi", "dr"]);

const isPromotionIntent = (keyword) =>
  hasAnyToken(keyword, ["uu dai", "khuyen mai", "giam gia", "combo", "he", "mua he"]);

const isPriceIntent = (keyword) =>
  hasAnyToken(keyword, ["gia", "bang gia", "chi phi", "bao nhieu tien"]);

const hasAnyToken = (text, tokens) => {
  const normalizedText = normalizeText(text);
  return tokens.some((token) => normalizedText.includes(normalizeText(token)));
};

const getDirectTokens = (keyword) =>
  normalizeText(keyword)
    .split(" ")
    .filter((token) => token.length >= 2 && !stopWords.has(token));

const getSearchTextParts = (item) => {
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const keywords = normalizeText(item.keywords?.join(" ") || "");
  const searchable = normalizeText(buildSearchText(item.type, item.title, item.description, item.keywords));
  return { title, description, keywords, searchable };
};

// score result (cham diem ket qua phu hop)
const scoreResult = (keyword, item) => {
  const normalizedKeyword = normalizeText(keyword);
  const { title, description, keywords, searchable } = getSearchTextParts(item);
  const tokens = getExpandedTokens(keyword);
  const directTokens = getDirectTokens(keyword);

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

  const exactDirectMatches = directTokens.filter((token) =>
    title.includes(token) || keywords.includes(token) || description.includes(token),
  ).length;

  if (directTokens.length > 0 && exactDirectMatches === 0) return 0;
  if (directTokens.length === 1 && exactDirectMatches === 1 && score < 70) return 0;

  return score;
};

const canShowResultForQuery = (keyword, item) => {
  const normalizedKeyword = normalizeText(keyword);
  const directTokens = getDirectTokens(keyword);
  const { title, keywords, searchable } = getSearchTextParts(item);

  if (!normalizedKeyword || directTokens.length === 0) return false;

  if (item.id?.startsWith("dentist-") && !isDoctorIntent(keyword)) return false;
  if (item.id?.startsWith("promotion-") && !isPromotionIntent(keyword) && !title.includes(normalizedKeyword)) return false;
  if (item.id?.startsWith("price-") && !isPriceIntent(keyword) && !keywords.includes(normalizedKeyword)) return false;

  const directHitCount = directTokens.filter((token) => searchable.includes(token)).length;
  const requiredHits = directTokens.length >= 3 ? 2 : 1;

  return directHitCount >= requiredHits;
};

const limitSearchResults = (items) => {
  const groupCounter = {};

  return items.filter((item) => {
    groupCounter[item.type] = groupCounter[item.type] || 0;
    if (groupCounter[item.type] >= 4) return false;
    groupCounter[item.type] += 1;
    return true;
  }).slice(0, 10);
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

// smart search page (tim dich vu, bac si, bang gia, kien thuc)
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
    // fetch search data (lay dich vu va nha si)
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
      ...publicKnowledgeResults.map((item) => ({ ...item, priority: 2 })),
      ...promotionResults,
      ...serviceResults,
      ...createPriceResults(),
      ...dentistResults,
    ];
  }, [dentists, services]);

  // matched results (sap xep ket qua theo diem)
  const matchedResults = useMemo(() => {
    const rankedResults = allResults
      .map((item) => ({
        ...item,
        score: scoreResult(keyword, item) + item.priority,
      }))
      .filter((item) => item.score >= 70 && canShowResultForQuery(keyword, item))
      .sort((first, second) => second.score - first.score);

    return limitSearchResults(rankedResults);
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
    // search submit (cap nhat keyword tren url)
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
