const {
  recordPageVisit,
  getDashboardSummary,
} = require("../models/dashboardModel");

// track visit (lưu lượt truy cập)
const savePageVisit = async (req, res) => {
  try {
    await recordPageVisit({
      path: req.body.path,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.status(201).json({
      message: "Page visit recorded successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// dashboard summary (thống kê tổng quan)
const getSummary = async (req, res) => {
  try {
    const dashboard = await getDashboardSummary();

    res.status(200).json({
      message: "Dashboard summary fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  savePageVisit,
  getSummary,
};
