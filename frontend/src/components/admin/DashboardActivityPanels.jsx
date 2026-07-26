import { Link } from "react-router-dom";

const appointmentStatusClass = (status) =>
  `dashboard-latest-appointments__status dashboard-latest-appointments__status--${String(
    status || "pending",
  ).toLowerCase()}`;

function DashboardActivityPanels({
  appointmentStatus,
  recentAppointments,
  serviceStats,
  sourceLabels,
  statusLabels,
}) {
  const maxAppointmentTotal = Math.max(
    ...appointmentStatus.map((item) => Number(item.total || 0)),
    1,
  );
  const maxServiceUsage = Math.max(
    ...serviceStats.map((item) => Number(item.usage_count || 0)),
    1,
  );

  return (
    <>
      <section className="dashboard-activity-grid">
        <article className="dashboard-appointment-status">
          <header className="dashboard-section-header">
            <div>
              <h3>Tình trạng lịch hẹn</h3>
              <p>Phân bổ trạng thái trong khoảng đang xem.</p>
            </div>
          </header>

          <div className="dashboard-appointment-status__list">
            {appointmentStatus.map((item) => (
              <div className="dashboard-appointment-status__item" key={item.status}>
                <div className="dashboard-appointment-status__meta">
                  <span>{statusLabels[item.status] || item.status}</span>
                  <strong>{item.total}</strong>
                </div>
                <div className="dashboard-appointment-status__track" aria-hidden="true">
                  <span
                    style={{
                      width: `${(Number(item.total || 0) / maxAppointmentTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-popular-services">
          <header className="dashboard-section-header">
            <div>
              <h3>Dịch vụ được sử dụng nhiều</h3>
              <p>Thống kê từ các dịch vụ đã ghi nhận trong hồ sơ thanh toán.</p>
            </div>
            {serviceStats.length > 0 && (
              <span className="dashboard-popular-services__count">
                Top {serviceStats.length}
              </span>
            )}
          </header>

          {serviceStats.length === 0 ? (
            <p className="dashboard-empty-state">
              Chưa có dữ liệu dịch vụ trong khoảng thời gian này.
            </p>
          ) : (
            <div className="dashboard-popular-services__list">
              {serviceStats.map((item) => (
                <div
                  className="dashboard-popular-services__item"
                  key={item.service_id || item.service_key || item.service_name}
                >
                  <div className="dashboard-popular-services__meta">
                    <strong>{item.service_name}</strong>
                    <span>
                      {item.usage_count} lượt • {item.record_count} hồ sơ
                    </span>
                  </div>
                  <div className="dashboard-popular-services__track" aria-hidden="true">
                    <span
                      style={{
                        width: `${(Number(item.usage_count || 0) / maxServiceUsage) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-latest-appointments">
        <header className="dashboard-section-header">
          <div>
            <h3>Lịch hẹn mới nhất</h3>
            <p>Hiển thị tối đa 7 lịch trong kỳ.</p>
          </div>
          <Link to="/admin/appointments">Xem tất cả</Link>
        </header>

        {recentAppointments.length === 0 ? (
          <p className="dashboard-empty-state">Chưa có lịch hẹn trong khoảng thời gian này.</p>
        ) : (
          <div className="dashboard-latest-appointments__list">
            {recentAppointments.map((appointment) => (
              <article
                className="dashboard-latest-appointments__row"
                key={appointment.id}
              >
                <div className="dashboard-latest-appointments__cell">
                  <span>Khách hàng</span>
                  <strong>{appointment.patient_name || "Chưa cập nhật tên"}</strong>
                  <small>{appointment.patient_phone || "Chưa cập nhật SĐT"}</small>
                </div>
                <div className="dashboard-latest-appointments__cell">
                  <span>Dịch vụ</span>
                  <strong>{appointment.service_name || "Chưa cập nhật dịch vụ"}</strong>
                </div>
                <div className="dashboard-latest-appointments__cell">
                  <span>Nha sĩ phụ trách</span>
                  <strong>{appointment.dentist_name || "Chưa phân công"}</strong>
                </div>
                <div className="dashboard-latest-appointments__cell">
                  <span>Ngày và giờ</span>
                  <strong>
                    {appointment.appointment_date_display || "Chưa cập nhật"}
                    {appointment.appointment_time ? ` • ${appointment.appointment_time}` : ""}
                  </strong>
                  <small>
                    {sourceLabels[appointment.booking_source] || "Chưa phân loại nguồn"}
                  </small>
                </div>
                <span className={appointmentStatusClass(appointment.status)}>
                  {statusLabels[appointment.status] || appointment.status}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default DashboardActivityPanels;
