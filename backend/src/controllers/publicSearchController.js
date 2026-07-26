const { searchPublicContent } = require("../services/publicRetrievalService");
const { sanitizePublicInput } = require("../utils/publicText");

const searchPublic = async (req, res) => {
  try {
    const query = sanitizePublicInput(req.query.q, 120);

    if (!query) {
      return res.status(400).json({
        message: "Vui lòng nhập từ khóa tìm kiếm.",
      });
    }

    const result = await searchPublicContent(query, 5);
    return res.status(200).json({
      message: "Tìm kiếm dữ liệu công khai thành công.",
      data: result,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[public-search] request failed", error.message);
    }

    return res.status(500).json({
      message: "Không thể tải kết quả tìm kiếm lúc này.",
    });
  }
};

module.exports = {
  searchPublic,
};
