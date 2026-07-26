import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import DashboardActivityPanels from "../components/admin/DashboardActivityPanels";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const SOURCE_LABELS = {
  website: "Website",
  customer: "Khách đăng nhập",
  admin: "Admin",
};

const toDateText = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayText = () => toDateText(new Date());

const startOfMonthText = () => {
  const today = new Date();
  return toDateText(new Date(today.getFullYear(), today.getMonth(), 1));
};

const formatDisplayDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

const toSeriesLabel = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

const formatCompactDecimal = (value) =>
  Number(value)
    .toFixed(1)
    .replace(/\.0$/, "")
    .replace(".", ",");

const formatShortMoney = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1000000000) return `${formatCompactDecimal(amount / 1000000000)} tỷ`;
  if (amount >= 1000000) return `${formatCompactDecimal(amount / 1000000)} triệu`;
  if (amount >= 1000) return `${Math.round(amount / 1000).toLocaleString("vi-VN")} nghìn`;
  return `${amount.toLocaleString("vi-VN")} VNĐ`;
};

const createNiceRevenueScale = (rawMax) => {
  if (!Number.isFinite(rawMax) || rawMax <= 0) {
    return {
      maxValue: 1000000,
      ticks: [0, 250000, 500000, 750000, 1000000],
    };
  }

  const million = 1000000;
  const billion = 1000000000;
  const paddedMax = rawMax * 1.15;
  const roundingStep =
    rawMax <= 10 * million
      ? million
      : rawMax <= 100 * million
        ? 10 * million
        : rawMax <= billion
          ? 100 * million
          : rawMax <= 5 * billion
            ? 500 * million
            : billion;
  const maxValue = Math.ceil(paddedMax / roundingStep) * roundingStep;
  const roundedIntervals = Math.round(maxValue / roundingStep);
  const intervalCount =
    roundedIntervals >= 3 && roundedIntervals <= 5 ? roundedIntervals : 4;

  return {
    maxValue,
    ticks: Array.from(
      { length: intervalCount + 1 },
      (_, index) => (maxValue / intervalCount) * index,
    ),
  };
};

const sanitizeFileName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState("month");
  const [customRange, setCustomRange] = useState({
    from: startOfMonthText(),
    to: todayText(),
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const activeRange = dashboard?.range || customRange;

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === "custom") {
      params.append("from", customRange.from);
      params.append("to", customRange.to);
    }
    return params.toString();
  }, [customRange.from, customRange.to, period]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        const dashboardResponse = await axiosClient.get(`/dashboard/summary?${queryString}`);
        setDashboard(dashboardResponse.data.data);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải dữ liệu tổng quan.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [queryString]);

  const formatMoney = (value) =>
    typeof value === "number" ? `${value.toLocaleString("vi-VN")} VNĐ` : "Chưa có dữ liệu";

  const overview = dashboard?.overview || {};
  const metadata = dashboard?.metadata || {};
  const revenueSeries = dashboard?.revenue_series || [];
  const serviceStats = (dashboard?.service_stats || []).slice(0, 5);
  const appointmentStatus = Object.keys(STATUS_LABELS).map((status) => ({
    status,
    total: Number(
      (dashboard?.appointment_status || []).find((item) => item.status === status)?.total || 0,
    ),
  }));
  const recentAppointments = dashboard?.recent_appointments || [];
  const upcomingReExams = dashboard?.upcoming_re_examinations || [];
  const revenueSummary = useMemo(() => {
    const values = revenueSeries.map((item) => Number(item.revenue || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    const peak = revenueSeries.reduce(
      (best, item) => (Number(item.revenue || 0) > Number(best.revenue || 0) ? item : best),
      { label: "", revenue: 0 },
    );
    const todayLabel = toSeriesLabel(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLabel = toSeriesLabel(yesterday);

    return {
      total,
      average: revenueSeries.length ? Math.round(total / revenueSeries.length) : 0,
      peak,
      today: revenueSeries.find((item) => item.label === todayLabel)?.revenue || 0,
      yesterday: revenueSeries.find((item) => item.label === yesterdayLabel)?.revenue || 0,
      last7: revenueSeries.slice(-7).reduce((sum, item) => sum + Number(item.revenue || 0), 0),
      last30: revenueSeries.slice(-30).reduce((sum, item) => sum + Number(item.revenue || 0), 0),
    };
  }, [revenueSeries]);
  const revenueChart = useMemo(() => {
    const width = 920;
    const height = 300;
    const padding = { top: 30, right: 26, bottom: 48, left: 76 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const rawMax = Math.max(
      ...revenueSeries.map((item) => Number(item.revenue || 0)),
      0,
    );
    const scale = createNiceRevenueScale(rawMax);
    const barSlot = revenueSeries.length ? innerWidth / revenueSeries.length : innerWidth;
    const barWidth = Math.max(10, Math.min(28, barSlot * 0.42));
    const labelStep = Math.max(1, Math.ceil(revenueSeries.length / 8));
    const bars = revenueSeries.map((item, index) => {
      const value = Number(item.revenue || 0);
      const barHeight = value > 0 ? Math.max((value / scale.maxValue) * innerHeight, 4) : 0;
      const x = padding.left + barSlot * index + (barSlot - barWidth) / 2;
      const y = padding.top + innerHeight - barHeight;

      return {
        ...item,
        value,
        x,
        y,
        width: barWidth,
        height: barHeight,
        showLabel:
          index === 0 ||
          index === revenueSeries.length - 1 ||
          index % labelStep === 0,
      };
    });

    return {
      width,
      height,
      padding,
      innerWidth,
      innerHeight,
      maxValue: scale.maxValue,
      ticks: scale.ticks,
      bars,
    };
  }, [revenueSeries]);
  const hoveredRevenue =
    hoveredRevenueIndex !== null ? revenueChart.bars[hoveredRevenueIndex] : null;
  const revenueTooltip = hoveredRevenue
    ? (() => {
        const width = 190;
        const height = 64;
        const margin = 8;
        const centerX = hoveredRevenue.x + hoveredRevenue.width / 2;
        const x = Math.min(
          Math.max(centerX - width / 2, margin),
          revenueChart.width - width - margin,
        );
        const hasRoomAbove = hoveredRevenue.y >= height + 18;
        const y = hasRoomAbove
          ? hoveredRevenue.y - height - 12
          : Math.min(
              hoveredRevenue.y + 12,
              revenueChart.height - height - margin,
            );

        return { x, y, width, height };
      })()
    : null;

  const exportReport = async () => {
    try {
      setExporting(true);
      const response = await axiosClient.get(`/dashboard/export?${queryString}`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${sanitizeFileName(
        `bao-cao-phong-kham-${formatDisplayDate(activeRange.from)}-den-${formatDisplayDate(activeRange.to)}`,
      )}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Không thể xuất báo cáo tổng hợp.");
    } finally {
      setExporting(false);
    }
  };

  const kpiCards = [
    {
      icon: "₫",
      label: "Tiền thực thu",
      value: formatMoney(overview.collected_amount),
      hint: metadata.payment_tracking_available
        ? "Tính từ payments.amount trong kỳ"
        : "Cần chạy migration thanh toán để có bảng payments",
    },
    {
      icon: "CN",
      label: "Công nợ còn lại",
      value: formatMoney(overview.debt_amount || 0),
      hint: `${overview.open_invoice_count || 0} hồ sơ còn phải thu`,
    },
    {
      icon: "LH",
      label: "Lịch hẹn trong kỳ",
      value: overview.appointment_count || 0,
      hint: `${overview.today_appointment_count || 0} lịch trong hôm nay`,
    },
    {
      icon: "KH",
      label: "Khách hàng mới",
      value: overview.new_customer_count || 0,
      hint: `${overview.customer_count || 0} tổng hồ sơ khách hàng`,
    },
  ];

  const actionItems = [
    {
      label: "Lịch chờ xác nhận",
      value: overview.pending_appointment_count || 0,
      hint: "Cần gọi hoặc nhắn khách để xác nhận",
      to: "/admin/appointments",
    },
    {
      label: "Bệnh án chờ nha sĩ xác nhận",
      value: overview.pending_record_count || 0,
      hint: "Theo dõi trước khi gửi kết quả cho khách",
      to: "/admin/customers",
    },
    {
      label: "Hồ sơ còn công nợ",
      value: overview.open_invoice_count || 0,
      hint: "Theo dõi thanh toán còn lại",
      to: "/admin/invoices",
    },
    {
      label: "Lịch tái khám sắp tới",
      value: overview.upcoming_reexam_count || 0,
      hint: "Trong 14 ngày gần nhất",
      to: "/admin/appointments",
    },
  ];

  if (loading) {
    return (
      <div className="ops-dashboard">
        <div className="ops-loading-card">Đang tải dữ liệu tổng quan...</div>
      </div>
    );
  }

  if (errorMessage && !dashboard) {
    return (
      <div className="ops-dashboard">
        <p className="admin-error-message">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="ops-dashboard">
      <section className="ops-page-heading">
        <div>
          <span className="ops-eyebrow">Dashboard Admin</span>
          <h2>Tổng quan phòng khám</h2>
          <p>
            Đang xem dữ liệu từ {formatDisplayDate(activeRange.from)} đến{" "}
            {formatDisplayDate(activeRange.to)}.
          </p>
        </div>

        <div className="ops-heading-actions">
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="custom">Khoảng ngày tùy chọn</option>
          </select>
          {period === "custom" && (
            <>
              <input
                type="date"
                value={customRange.from}
                onChange={(event) =>
                  setCustomRange((current) => ({ ...current, from: event.target.value }))
                }
              />
              <input
                type="date"
                value={customRange.to}
                onChange={(event) =>
                  setCustomRange((current) => ({ ...current, to: event.target.value }))
                }
              />
            </>
          )}
          <button type="button" onClick={exportReport} disabled={exporting}>
            {exporting ? "Đang xuất..." : "Xuất báo cáo"}
          </button>
        </div>
      </section>

      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      <section className="ops-kpi-grid">
        {kpiCards.map((card) => (
          <article className="ops-kpi-card" key={card.label}>
            <span className="ops-kpi-icon">{card.icon}</span>
            <div>
              <p>{card.label}</p>
              <strong>{card.value}</strong>
              <small>{card.hint}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="ops-work-grid">
        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Cần xử lý</h3>
              <p>Các việc vận hành cần ưu tiên trong kỳ.</p>
            </div>
          </div>
          <div className="ops-action-list">
            {actionItems.map((item) => (
              <Link className="ops-action-row" to={item.to} key={item.label}>
                <strong>{item.value}</strong>
                <div>
                  <span>{item.label}</span>
                  <small>{item.hint}</small>
                </div>
                <em>Đi tới</em>
              </Link>
            ))}
          </div>
        </div>

        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Hoạt động website</h3>
              <p>Lấy từ bảng tracking thực tế.</p>
            </div>
          </div>
          <div className="ops-web-grid">
            <div>
              <span>Lượt truy cập trong kỳ</span>
              <strong>{overview.visit_count || 0}</strong>
            </div>
            <div>
              <span>Lượt truy cập hôm nay</span>
              <strong>{overview.today_visit_count || 0}</strong>
            </div>
            <div>
              <span>Lịch đặt qua website</span>
              <strong>
                {metadata.booking_source_available
                  ? overview.web_booking_count || 0
                  : "Chưa phân loại"}
              </strong>
            </div>
            <div>
              <span>Tỷ lệ đặt lịch</span>
              <strong>
                {typeof overview.web_booking_conversion_rate === "number"
                  ? `${overview.web_booking_conversion_rate}%`
                  : "Chưa đủ dữ liệu"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ops-panel ops-revenue-panel">
        <div className="ops-panel-header ops-revenue-header">
          <div>
            <h3>Tiền thực thu theo thời gian</h3>
            <p>Tổng hợp từ các lần thanh toán đã ghi nhận.</p>
          </div>
          <div className="ops-revenue-topline">
            <div>
              <span>Tổng trong kỳ</span>
              <strong>{formatMoney(revenueSummary.total)}</strong>
            </div>
            <div>
              <span>Trung bình/ngày</span>
              <strong>{formatMoney(revenueSummary.average)}</strong>
            </div>
            <div>
              <span>Ngày cao nhất</span>
              <strong>{formatMoney(revenueSummary.peak.revenue)}</strong>
              <small>{revenueSummary.peak.label || "Chưa có"}</small>
            </div>
          </div>
        </div>

        <div className="ops-revenue-chart" onMouseLeave={() => setHoveredRevenueIndex(null)}>
          {revenueSeries.length === 0 ? (
            <p className="ops-muted">Chưa có dữ liệu thanh toán trong khoảng đang xem.</p>
          ) : (
            <>
              <svg
                className="ops-revenue-svg"
                viewBox={`0 0 ${revenueChart.width} ${revenueChart.height}`}
                role="img"
                aria-label="Biểu đồ tiền thực thu theo thời gian"
              >
                <defs>
                  <linearGradient id="opsRevenueBar" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ff8a1f" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>

                {revenueChart.ticks.map((value) => {
                  const y =
                    revenueChart.padding.top +
                    revenueChart.innerHeight * (1 - value / revenueChart.maxValue);

                  return (
                    <g key={value}>
                      <line
                        x1={revenueChart.padding.left}
                        x2={revenueChart.padding.left + revenueChart.innerWidth}
                        y1={y}
                        y2={y}
                        className="ops-revenue-gridline"
                      />
                      <text x={revenueChart.padding.left - 12} y={y + 4} className="ops-revenue-axis-label">
                        {formatShortMoney(value)}
                      </text>
                    </g>
                  );
                })}

                <line
                  x1={revenueChart.padding.left}
                  x2={revenueChart.padding.left + revenueChart.innerWidth}
                  y1={revenueChart.padding.top + revenueChart.innerHeight}
                  y2={revenueChart.padding.top + revenueChart.innerHeight}
                  className="ops-revenue-axis"
                />

                {revenueChart.bars.map((item, index) => (
                  <g key={`${item.label}-${index}`}>
                    <rect
                      x={item.x}
                      y={item.y}
                      width={item.width}
                      height={item.height}
                      rx="8"
                      className={`ops-revenue-svg-bar${hoveredRevenueIndex === index ? " is-active" : ""}`}
                    />
                    <rect
                      x={item.x - 10}
                      y={revenueChart.padding.top}
                      width={item.width + 20}
                      height={revenueChart.innerHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredRevenueIndex(index)}
                      onFocus={() => setHoveredRevenueIndex(index)}
                      tabIndex="0"
                    />
                    {item.showLabel && (
                      <text
                        x={item.x + item.width / 2}
                        y={revenueChart.padding.top + revenueChart.innerHeight + 26}
                        className="ops-revenue-x-label"
                      >
                        {item.label}
                      </text>
                    )}
                  </g>
                ))}

                {hoveredRevenue && revenueTooltip && (
                  <g
                    className="ops-revenue-svg-tooltip"
                    transform={`translate(${revenueTooltip.x} ${revenueTooltip.y})`}
                    aria-hidden="true"
                  >
                    <rect
                      width={revenueTooltip.width}
                      height={revenueTooltip.height}
                      rx="12"
                    />
                    <text x="14" y="24" className="ops-revenue-tooltip-label">
                      Ngày {hoveredRevenue.label}
                    </text>
                    <text x="14" y="48" className="ops-revenue-tooltip-value">
                      {formatMoney(hoveredRevenue.value)}
                    </text>
                  </g>
                )}
              </svg>
            </>
          )}
        </div>

        <div className="ops-revenue-mini-grid">
          <div>
            <span>Hôm nay</span>
            <strong>{formatShortMoney(revenueSummary.today)}</strong>
          </div>
          <div>
            <span>Hôm qua</span>
            <strong>{formatShortMoney(revenueSummary.yesterday)}</strong>
          </div>
          <div>
            <span>7 ngày gần nhất</span>
            <strong>{formatShortMoney(revenueSummary.last7)}</strong>
          </div>
          <div>
            <span>30 ngày gần nhất</span>
            <strong>{formatShortMoney(revenueSummary.last30)}</strong>
          </div>
        </div>
      </section>

      <DashboardActivityPanels
        appointmentStatus={appointmentStatus}
        recentAppointments={recentAppointments}
        serviceStats={serviceStats}
        sourceLabels={SOURCE_LABELS}
        statusLabels={STATUS_LABELS}
      />

      <section className="ops-panel">
        <div className="ops-panel-header">
          <div>
            <h3>Lịch tái khám gần nhất</h3>
            <p>Các bệnh nhân cần được nhắc lịch trong 14 ngày tới.</p>
          </div>
        </div>
        <div className="ops-reexam-grid">
          {upcomingReExams.length === 0 && (
            <p className="ops-muted">Chưa có lịch tái khám sắp tới.</p>
          )}
          {upcomingReExams.map((item) => (
            <article key={item.id}>
              <strong>{item.patient_name}</strong>
              <span>{item.patient_phone}</span>
              <p>{item.re_examination_date_display} lúc {item.re_examination_time}</p>
              <small>{item.treatment_plan || item.note || "Chưa có nội dung tái khám"}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
