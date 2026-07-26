const pool = require("../config/db");
const { clinicKnowledge, faqKnowledge } = require("../data/publicKnowledge");
const {
  isCloseToken,
  normalizeVietnamese,
  sanitizePublicInput,
  tokenize,
} = require("../utils/publicText");

const STOP_WORDS = new Set([
  "anh",
  "bac",
  "bao",
  "biet",
  "bsi",
  "cho",
  "chuyen",
  "co",
  "cua",
  "database",
  "dung",
  "em",
  "gia",
  "gi",
  "hay",
  "hoi",
  "khoa",
  "la",
  "may",
  "minh",
  "mon",
  "muon",
  "nha",
  "nhieu",
  "noi",
  "bia",
  "phong",
  "si",
  "tien",
  "toi",
  "trong",
  "tu",
  "ve",
]);

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(value))} VNĐ`;

const getQueryTokens = (value) =>
  tokenize(value).filter((token) => !STOP_WORDS.has(token));

const buildSearchText = (item) =>
  normalizeVietnamese(
    [item.title, item.content, ...(item.keywords || [])].filter(Boolean).join(" "),
  );

const scorePublicItem = (query, item) => {
  const normalizedQuery = normalizeVietnamese(query);
  if (!normalizedQuery) return 0;

  const normalizedTitle = normalizeVietnamese(item.title);
  const normalizedContent = normalizeVietnamese(item.content);
  const normalizedKeywords = normalizeVietnamese((item.keywords || []).join(" "));
  const searchable = buildSearchText(item);
  const queryTokens = getQueryTokens(normalizedQuery);
  const candidateTokens = tokenize(`${item.title} ${(item.keywords || []).join(" ")}`);

  let score = 0;
  if (normalizedTitle === normalizedQuery) score += 1000;
  if (normalizedTitle.startsWith(normalizedQuery)) score += 700;
  if (normalizedTitle.includes(normalizedQuery)) score += 500;
  if (normalizedKeywords.includes(normalizedQuery)) score += 420;
  if (normalizedContent.includes(normalizedQuery)) score += 250;

  let matchedTokens = 0;
  queryTokens.forEach((queryToken) => {
    if (normalizeVietnamese(item.title).split(" ").includes(queryToken)) {
      score += 90;
      matchedTokens += 1;
      return;
    }
    if (normalizedTitle.includes(queryToken)) {
      score += 70;
      matchedTokens += 1;
      return;
    }
    if (normalizedKeywords.includes(queryToken)) {
      score += 55;
      matchedTokens += 1;
      return;
    }
    if (candidateTokens.some((candidateToken) => isCloseToken(queryToken, candidateToken))) {
      score += 18;
      matchedTokens += 1;
      return;
    }
    if (normalizedContent.includes(queryToken)) {
      score += 12;
    }
  });

  if (queryTokens.length > 0 && matchedTokens === 0) return 0;
  const requiredMatches =
    queryTokens.length <= 2 ? queryTokens.length : Math.ceil(queryTokens.length * 0.6);
  if (matchedTokens < requiredMatches) return 0;
  return score;
};

const getPublicDatabaseItems = async () => {
  let servicesResult = { rows: [] };
  let dentistsResult = { rows: [] };

  try {
    [servicesResult, dentistsResult] = await Promise.all([
      pool.query(`
        SELECT id, service_name, price, description
        FROM services
        WHERE is_active = TRUE
        ORDER BY service_name ASC
      `),
      pool.query(`
        SELECT d.id, d.full_name, d.specialty
        FROM dentists d
        LEFT JOIN users u ON u.id = d.user_id
        WHERE COALESCE(d.is_active, TRUE) = TRUE
          AND COALESCE(u.is_active, TRUE) = TRUE
        ORDER BY d.full_name ASC
      `),
    ]);
  } catch (error) {
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      console.debug("[public-retrieval] database lookup failed", error.name);
    }
  }

  const services = servicesResult.rows.map((service) => {
    const hasVerifiedPrice = service.price !== null && Number.isFinite(Number(service.price));
    const priceText = hasVerifiedPrice
      ? `Giá đang ghi nhận trong hệ thống: ${formatCurrency(service.price)}.`
      : "Giá chưa được cập nhật trong cơ sở dữ liệu công khai.";

    return {
      id: `service-${service.id}`,
      entityId: service.id,
      type: "service",
      title: service.service_name,
      content: `${service.description || "Dịch vụ nha khoa đang hoạt động."} ${priceText}`,
      keywords: [service.service_name, service.description, "dịch vụ nha khoa"],
      url: "/booking",
      metadata: {
        price: hasVerifiedPrice ? Number(service.price) : null,
      },
    };
  });

  const dentists = dentistsResult.rows.map((dentist) => ({
    id: `dentist-${dentist.id}`,
    entityId: dentist.id,
    type: "dentist",
    title: dentist.full_name,
    content: dentist.specialty
      ? `Chuyên môn được ghi nhận: ${dentist.specialty}.`
      : "Chuyên môn chưa được cập nhật trong cơ sở dữ liệu công khai.",
    keywords: [dentist.full_name, dentist.specialty, "bác sĩ", "nha sĩ"],
    url: "/booking",
    metadata: {
      specialty: dentist.specialty || null,
    },
  }));

  return [...services, ...dentists, ...clinicKnowledge, ...faqKnowledge];
};

const toPublicSource = (item) => ({
  id: item.id,
  type: item.type,
  title: item.title,
  url: item.url,
});

const retrievePublicContext = async (rawQuery, limit = 5) => {
  const query = sanitizePublicInput(rawQuery);
  if (!query) return [];

  const items = await getPublicDatabaseItems();

  return items
    .map((item) => ({ ...item, score: scorePublicItem(query, item) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "vi"))
    .slice(0, Math.min(Math.max(limit, 1), 5));
};

const searchPublicContent = async (rawQuery, perGroupLimit = 5) => {
  const query = sanitizePublicInput(rawQuery, 120);
  if (!query) return { query, groups: [], total: 0 };

  const ranked = (await getPublicDatabaseItems())
    .map((item) => ({ ...item, score: scorePublicItem(query, item) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, "vi"));

  const groupLabels = {
    service: "Dịch vụ",
    dentist: "Nha sĩ",
    faq: "Hỏi đáp",
    clinic: "Thông tin phòng khám",
  };
  const grouped = new Map();

  ranked.forEach((item) => {
    if (!grouped.has(item.type)) grouped.set(item.type, []);
    const group = grouped.get(item.type);
    if (group.length < Math.min(Math.max(perGroupLimit, 1), 10)) {
      group.push({
        ...toPublicSource(item),
        description: item.content,
      });
    }
  });

  const groups = [...grouped.entries()].map(([type, items]) => ({
    type,
    label: groupLabels[type],
    items,
  }));

  return {
    query,
    groups,
    total: groups.reduce((total, group) => total + group.items.length, 0),
  };
};

module.exports = {
  retrievePublicContext,
  scorePublicItem,
  searchPublicContent,
  toPublicSource,
};
