import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

// status label (doi trang thai sang tieng viet)
const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

// admin dashboard page (tong quan he thong)
function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // fetch dashboard summary (lay so lieu tong quan)
    const fetchDashboard = async () => {
      try {
        const dashboardResponse = await axiosClient.get("/dashboard/summary");
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
  }, []);

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")} VNĐ`;
  };

  if (loading) {
    return (
      <div className="admin-page">
        <p>Đang tải dữ liệu tổng quan...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="admin-page">
        <p className="admin-error-message">{errorMessage}</p>
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const serviceStats = dashboard?.service_stats || [];
  const revenueDays = dashboard?.revenue_last_7_days || [];
  const monthlyStats = dashboard?.monthly_stats || [];
  const appointmentStatus = dashboard?.appointment_status || [];
  const recentAppointments = dashboard?.recent_appointments || [];

  const maxServiceTotal = Math.max(...serviceStats.map((item) => item.total), 1);
  const maxRevenue = Math.max(...revenueDays.map((item) => item.revenue), 1);
  const maxMonthlyRevenue = Math.max(...monthlyStats.map((item) => item.revenue), 1);
  const maxStatusTotal = Math.max(...appointmentStatus.map((item) => item.total), 1);

  const attentionItems = [
    {
      label: "Lịch chờ xác nhận",
      value: overview.pending_appointment_count,
      hint: "Cần gọi hoặc nhắn khách sớm",
      to: "/admin/appointments",
      tone: "urgent",
    },
    {
      label: "Lịch khám hôm nay",
      value: overview.today_appointment_count,
      hint: "Theo dõi khách đến và phân ghế khám",
      to: "/admin/appointments",
      tone: "today",
    },
    {
      label: "Hóa đơn còn theo dõi",
      value: overview.open_invoice_count,
      hint: "Gồm chưa thanh toán và thanh toán một phần",
      to: "/admin/invoices",
      tone: "money",
    },
    {
      label: "Hồ sơ điều trị hôm nay",
      value: overview.today_record_count,
      hint: "Kết quả được nha sĩ hoặc lễ tân cập nhật",
      to: "/admin/customers",
      tone: "record",
    },
  ];

  const summaryCards = [
    {
      label: "Khách hàng",
      value: overview.customer_count,
      hint: "Tổng hồ sơ đang quản lý",
      tone: "blue",
    },
    {
      label: "Nha sĩ hoạt động",
      value: overview.dentist_count,
      hint: "Có thể phân công lịch khám",
      tone: "green",
    },
    {
      label: "Dịch vụ đang mở",
      value: overview.active_service_count,
      hint: "Hiển thị cho khách đặt lịch",
      tone: "orange",
    },
    {
      label: "Lượt truy cập tháng này",
      value: overview.month_visit_count,
      hint: `${overview.today_visit_count || 0} lượt trong hôm nay`,
      tone: "yellow",
    },
  ];

  return (
    <div className="dashboard-page dashboard-page-v2">
      <section className="dashboard-hero dashboard-hero-v2">
        <div>
          <p className="dashboard-kicker">Nha khoa V</p>
          <h2>Chăm sóc rõ ràng, phục vụ tận tâm</h2>
          <p>
            Theo dõi lịch hẹn, khách hàng, doanh thu và lượt truy cập để lễ tân xử lý đúng việc trước, chủ phòng khám xem được tình hình theo ngày và theo tháng.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <Link to="/admin/appointments">Xử lý lịch hẹn</Link>
          <Link to="/admin/invoices">Lập hóa đơn</Link>
        </div>
      </section>

      <section className="dashboard-command-center">
        <div className="dashboard-command-left">
          <span className="dashboard-section-label">Cần chú ý hôm nay</span>
          <h3>Việc nên xử lý trước</h3>
          <p>Những chỉ số này giúp nhân viên không bỏ sót lịch hẹn, hóa đơn hoặc hồ sơ điều trị mới.</p>
        </div>

        <div className="dashboard-attention-grid">
          {attentionItems.map((item) => (
            <Link className={`dashboard-attention-card ${item.tone}`} to={item.to} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value || 0}</strong>
              <small>{item.hint}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-card-grid">
        {summaryCards.map((card) => (
          <div className={`dashboard-stat-card ${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value || 0}</strong>
            <small>{card.hint}</small>
          </div>
        ))}
      </section>

      <section className="dashboard-money-grid">
        <div className="dashboard-money-card dashboard-money-card-main">
          <span>Doanh thu đã thu hôm nay</span>
          <strong>{formatMoney(overview.today_revenue)}</strong>
          <small>Dựa trên số tiền lễ tân đã ghi nhận trong hóa đơn.</small>
        </div>

        <div className="dashboard-money-card">
          <span>Doanh thu đã thu trong tháng</span>
          <strong>{formatMoney(overview.month_revenue)}</strong>
          <small>Tổng kết dòng tiền thực thu của tháng hiện tại.</small>
        </div>

        <div className="dashboard-money-card">
          <span>Tổng hóa đơn</span>
          <strong>{overview.invoice_count || 0}</strong>
          <small>Bao gồm hóa đơn đã thanh toán và thanh toán một phần.</small>
        </div>
      </section>

      <section className="dashboard-grid-two">
        <div className="dashboard-panel">
          <div className="dashboard-panel-title">
            <h3>Dịch vụ được đặt trong 30 ngày</h3>
            <span>Theo số lịch hẹn</span>
          </div>

          <div className="dashboard-bar-list">
            {serviceStats.map((item) => (
              <div className="dashboard-bar-item" key={item.service_name}>
                <div>
                  <span>{item.service_name}</span>
                  <strong>{item.total}</strong>
                </div>
                <div className="dashboard-bar-track">
                  <div
                    className="dashboard-bar-fill"
                    style={{ width: `${(item.total / maxServiceTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel dashboard-panel-dark">
          <div className="dashboard-panel-title">
            <h3>Doanh thu 7 ngày gần nhất</h3>
            <span>Số tiền thực thu</span>
          </div>

          <div className="dashboard-revenue-chart">
            {revenueDays.map((item) => (
              <div className="dashboard-revenue-day" key={item.label}>
                <strong>{formatMoney(item.revenue)}</strong>
                <div className="dashboard-revenue-column-wrap">
                  <div
                    className="dashboard-revenue-column"
                    style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 4)}%` }}
                  />
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid-two">
        <div className="dashboard-panel">
          <div className="dashboard-panel-title">
            <h3>Tổng kết 6 tháng gần nhất</h3>
            <span>Doanh thu và lượt truy cập</span>
          </div>

          <div className="dashboard-month-list">
            {monthlyStats.map((item) => (
              <div className="dashboard-month-row" key={item.label}>
                <span>{item.label}</span>
                <div className="dashboard-month-track">
                  <div
                    className="dashboard-month-fill"
                    style={{ width: `${Math.max((item.revenue / maxMonthlyRevenue) * 100, 4)}%` }}
                  />
                </div>
                <div className="dashboard-month-value">
                  <strong>{formatMoney(item.revenue)}</strong>
                  <small>{item.visits} lượt truy cập</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-title">
            <h3>Tình trạng lịch hẹn</h3>
            <span>Toàn hệ thống</span>
          </div>

          <div className="dashboard-bar-list">
            {appointmentStatus.map((item) => (
              <div className="dashboard-bar-item" key={item.status}>
                <div>
                  <span>{STATUS_LABELS[item.status] || item.status}</span>
                  <strong>{item.total}</strong>
                </div>
                <div className="dashboard-bar-track muted">
                  <div
                    className="dashboard-bar-fill secondary"
                    style={{ width: `${(item.total / maxStatusTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-title">
          <h3>Lịch hẹn mới nhất</h3>
          <span>Lễ tân cần theo dõi</span>
        </div>

        <div className="dashboard-recent-list">
          {recentAppointments.map((appointment) => (
            <div className="dashboard-recent-item" key={appointment.id}>
              <div>
                <strong>{appointment.patient_name}</strong>
                <span>
                  {appointment.service_name} - {appointment.dentist_name || "Chưa phân công"}
                </span>
              </div>
              <div>
                <strong>{appointment.appointment_date_display}</strong>
                <span>{String(appointment.appointment_time).slice(0, 5)}</span>
              </div>
              <span
                className={`appointment-status ${
                  appointment.status === "Confirmed"
                    ? "confirmed"
                    : appointment.status === "Completed"
                      ? "completed"
                      : appointment.status === "Cancelled"
                        ? "cancelled"
                        : "pending"
                }`}
              >
                {STATUS_LABELS[appointment.status] || appointment.status}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

export default Dashboard;
