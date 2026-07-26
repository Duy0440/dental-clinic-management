const {
  recordPageVisit,
  getDashboardSummary,
} = require("../models/dashboardModel");
const { buildWorkbook, rowXml } = require("../utils/xlsxBuilder");

const toDateText = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateText = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : value;
};

const getDateRange = (query = {}) => {
  const today = new Date();
  const period = query.period || "month";
  let fromDate = new Date(today);
  let toDate = new Date(today);

  if (period === "today") {
    fromDate = new Date(today);
  } else if (period === "week") {
    const day = today.getDay() || 7;
    fromDate = new Date(today);
    fromDate.setDate(today.getDate() - day + 1);
  } else if (period === "custom") {
    const from = parseDateText(query.from);
    const to = parseDateText(query.to);
    return {
      period,
      from: from || toDateText(today),
      to: to || from || toDateText(today),
    };
  } else {
    fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return {
    period,
    from: toDateText(fromDate),
    to: toDateText(toDate),
  };
};

const formatDateForFile = (value) => String(value || "").split("-").reverse().join("-");

const sanitizeFileName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

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

const getSummary = async (req, res) => {
  try {
    const range = getDateRange(req.query);
    const dashboard = await getDashboardSummary(range);

    res.status(200).json({
      message: "Dashboard summary fetched successfully",
      data: {
        ...dashboard,
        range,
      },
    });
  } catch (error) {
    console.error("getSummary failed:", error);
    res.status(500).json({
      message: "Không thể tải dữ liệu tổng quan.",
      error: error.message,
    });
  }
};

const buildOverviewRows = (dashboard) => {
  const overview = dashboard.overview || {};
  const range = dashboard.range || {};

  return [
    rowXml(["BÁO CÁO TỔNG QUAN PHÒNG KHÁM"], 1, [3]),
    rowXml(["Khoảng thời gian", `${range.from} đến ${range.to}`], 3, [2, 5]),
    rowXml(["Tiền thực thu", overview.collected_amount ?? "Chưa có bảng payments"], 4, [2, typeof overview.collected_amount === "number" ? 1 : 5]),
    rowXml(["Công nợ còn lại", overview.debt_amount || 0], 5, [2, 1]),
    rowXml(["Tổng giảm giá", overview.discount_amount || 0], 6, [2, 1]),
    rowXml(["Hồ sơ thanh toán trong kỳ", overview.invoice_count || 0], 7, [2, 5]),
    rowXml(["Lịch hẹn trong kỳ", overview.appointment_count || 0], 8, [2, 5]),
    rowXml(["Lịch đặt qua website", overview.web_booking_count ?? "Chưa có booking_source"], 9, [2, 5]),
    rowXml(["Lượt truy cập website", overview.visit_count || 0], 10, [2, 5]),
    rowXml(["Khách hàng mới", overview.new_customer_count || 0], 11, [2, 5]),
    rowXml(["Bệnh án đã xác nhận", overview.confirmed_record_count || 0], 12, [2, 5]),
  ];
};

const buildSimpleSheetRows = (title, headers, rows, mapper, moneyColumns = []) => {
  const xmlRows = [rowXml([title], 1, [3]), rowXml(headers, 3, headers.map(() => 4))];
  let rowIndex = 4;

  rows.forEach((item) => {
    const values = mapper(item);
    xmlRows.push(
      rowXml(
        values,
        rowIndex,
        values.map((_, index) => (moneyColumns.includes(index) ? 1 : 5)),
      ),
    );
    rowIndex += 1;
  });

  return xmlRows;
};

const exportSummary = async (req, res) => {
  try {
    const range = getDateRange(req.query);
    const dashboard = await getDashboardSummary(range);
    const withRange = { ...dashboard, range };
    const workbook = buildWorkbook([
      {
        name: "Tổng quan",
        rows: buildOverviewRows(withRange),
        widths: [28, 36],
        titleMergeTo: 2,
      },
      {
        name: "Lịch hẹn",
        rows: buildSimpleSheetRows(
          "LỊCH HẸN TRONG KỲ",
          ["Ngày", "Giờ", "Khách hàng", "Dịch vụ", "Nha sĩ", "Trạng thái", "Nguồn"],
          dashboard.recent_appointments || [],
          (item) => [
            item.appointment_date_display || "",
            item.appointment_time || "",
            item.patient_name || "",
            item.service_name || "",
            item.dentist_name || "Chưa phân công",
            item.status || "",
            item.booking_source || "Chưa phân loại",
          ],
        ),
        widths: [14, 10, 26, 28, 24, 18, 18],
        titleMergeTo: 7,
      },
      {
        name: "Thanh toán",
        rows: buildSimpleSheetRows(
          "THANH TOÁN THỰC THU",
          ["Ngày thanh toán", "Khách hàng", "Số tiền thực thu", "Phương thức", "Người ghi nhận"],
          dashboard.payments || [],
          (item) => [
            item.payment_date_display || "",
            item.patient_name || "",
            item.amount || 0,
            item.payment_method || "",
            item.created_by_username || "",
          ],
          [2],
        ),
        widths: [18, 28, 20, 18, 22],
        titleMergeTo: 5,
      },
      {
        name: "Dịch vụ",
        rows: buildSimpleSheetRows(
          "DỊCH VỤ ĐƯỢC SỬ DỤNG NHIỀU",
          ["Dịch vụ", "Số lượt sử dụng", "Số hồ sơ sử dụng"],
          dashboard.service_stats || [],
          (item) => [
            item.service_name,
            item.usage_count || 0,
            item.record_count || 0,
          ],
        ),
        widths: [34, 18, 18],
        titleMergeTo: 3,
      },
    ]);

    const filename = sanitizeFileName(
      `bao-cao-phong-kham-${formatDateForFile(range.from)}-den-${formatDateForFile(range.to)}`,
    );

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
    return res.send(workbook);
  } catch (error) {
    console.error("exportSummary failed:", error);
    return res.status(500).json({ message: "Không thể xuất báo cáo tổng hợp." });
  }
};

module.exports = {
  savePageVisit,
  getSummary,
  exportSummary,
};
