import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

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
  const serviceStats = dashboard?.service_stats || [];
  const appointmentStatus = dashboard?.appointment_status || [];
  const recentAppointments = dashboard?.recent_appointments || [];
  const upcomingReExams = dashboard?.upcoming_re_examinations || [];
  const maxRevenue = Math.max(...revenueSeries.map((item) => Number(item.revenue || 0)), 1);
  const serviceTotalValue = serviceStats.reduce(
    (total, item) => total + Number(item.service_value || 0),
    0,
  );
  const maxAppointmentStatus = Math.max(...appointmentStatus.map((item) => item.total), 1);

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

      <section className="ops-grid-two">
        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Tiền thực thu theo thời gian</h3>
              <p>Chỉ tính các lần thanh toán đã ghi nhận trong bảng payments.</p>
            </div>
          </div>

          <div className="ops-revenue-chart">
            {revenueSeries.map((item) => (
              <div className="ops-revenue-bar" key={item.label} title={formatMoney(item.revenue)}>
                <div>
                  <span style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 4)}%` }} />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Hiệu quả dịch vụ</h3>
              <p>Số lượt sử dụng và tổng giá trị dòng dịch vụ, tách riêng với tiền thực thu.</p>
            </div>
          </div>

          <div className="ops-service-list">
            {serviceStats.length === 0 && (
              <p className="ops-muted">Chưa có dòng dịch vụ trong kỳ.</p>
            )}
            {serviceStats.map((item) => (
              <div className="ops-service-row" key={item.service_name}>
                <div>
                  <strong>{item.service_name}</strong>
                  <span>{item.usage_count} lượt • {formatMoney(item.service_value)}</span>
                </div>
                <small>{item.share}%</small>
                <div className="ops-progress">
                  <span style={{ width: `${serviceTotalValue ? item.share : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ops-grid-two">
        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Tình trạng lịch hẹn</h3>
              <p>Phân bổ trạng thái trong khoảng đang xem.</p>
            </div>
          </div>
          <div className="ops-status-list">
            {appointmentStatus.map((item) => (
              <div className="ops-status-row" key={item.status}>
                <div>
                  <span>{STATUS_LABELS[item.status] || item.status}</span>
                  <strong>{item.total}</strong>
                </div>
                <div className="ops-progress">
                  <span style={{ width: `${(item.total / maxAppointmentStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Lịch hẹn mới nhất</h3>
              <p>Hiển thị tối đa 7 lịch trong kỳ.</p>
            </div>
            <Link to="/admin/appointments">Xem tất cả</Link>
          </div>
          <div className="ops-appointment-list">
            {recentAppointments.map((appointment) => (
              <article key={appointment.id} className="ops-appointment-row">
                <div>
                  <strong>{appointment.patient_name}</strong>
                  <span>{appointment.service_name}</span>
                  <small>{appointment.dentist_name || "Chưa phân công"}</small>
                </div>
                <div>
                  <strong>{appointment.appointment_date_display}</strong>
                  <span>{appointment.appointment_time}</span>
                  <small>{SOURCE_LABELS[appointment.booking_source] || "Chưa phân loại nguồn"}</small>
                </div>
                <span className={`appointment-status ${
                  appointment.status === "Confirmed"
                    ? "confirmed"
                    : appointment.status === "Completed"
                      ? "completed"
                      : appointment.status === "Cancelled"
                        ? "cancelled"
                        : "pending"
                }`}>
                  {STATUS_LABELS[appointment.status] || appointment.status}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

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
