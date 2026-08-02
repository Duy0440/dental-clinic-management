// nha si xem dashboard ca nhan
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_CLASSES = {
  Pending: "pending",
  Confirmed: "confirmed",
  Completed: "completed",
  Cancelled: "cancelled",
};

const todayText = () => new Date().toISOString().slice(0, 10);

const formatDate = (date) => {
  if (!date) return "Chưa cập nhật";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
};

const formatTime = (time) => (time ? String(time).slice(0, 5) : "Chưa cập nhật");

function DentistDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const doctorName = user?.dentist_name || user?.full_name || user?.username || "bác sĩ";
  const today = todayText();

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        const [appointmentResponse, recordResponse] = await Promise.allSettled([
          axiosClient.get("/appointments/dentist/my-schedule"),
          axiosClient.get("/medical-records"),
        ]);

        if (appointmentResponse.status === "fulfilled") {
          setAppointments(appointmentResponse.value.data.data || []);
        }

        if (recordResponse.status === "fulfilled") {
          setRecords(recordResponse.value.data.data || []);
        }

        if (appointmentResponse.status === "rejected" && recordResponse.status === "rejected") {
          setErrorMessage("Không thể tải trang làm việc của nha sĩ.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, []);

  const todayAppointments = appointments.filter((item) => item.appointment_date === today);
  const confirmedAppointments = appointments.filter((item) => item.status === "Confirmed");
  const needRecordAppointments = confirmedAppointments.filter((item) => !item.has_medical_record);
  const pendingRecords = records.filter((record) => record.status === "PendingConfirmation");
  const upcomingAppointments = appointments
    .filter((item) => item.status !== "Cancelled")
    .slice(0, 6);
  const upcomingReExams = useMemo(
    () =>
      records
        .filter((record) => record.re_examination_date)
        .sort((a, b) =>
          `${a.re_examination_date} ${a.re_examination_time || ""}`.localeCompare(
            `${b.re_examination_date} ${b.re_examination_time || ""}`,
          ),
        )
        .slice(0, 4),
    [records],
  );

  if (loading) {
    return <div className="dentist-page"><p className="dentist-muted-text">Đang tải trang làm việc...</p></div>;
  }

  return (
    <div className="dentist-workbench">
      <section className="dentist-workbench-header">
        <div>
          <span className="dentist-eyebrow">Tổng quan chuyên môn</span>
          <h2>Xin chào, {doctorName}</h2>
          <p>Hôm nay có {todayAppointments.length} lịch khám cần theo dõi.</p>
        </div>
        <Link to="/dentist/appointments" className="dentist-small-button">Mở lịch khám</Link>
      </section>

      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      <section className="dentist-stat-grid four-columns compact">
        <article className="dentist-stat-card">
          <span>Lịch hôm nay</span>
          <strong>{todayAppointments.length}</strong>
          <p>Các lịch trong ngày</p>
        </article>
        <article className="dentist-stat-card">
          <span>Đã xác nhận</span>
          <strong>{confirmedAppointments.length}</strong>
          <p>Sẵn sàng thăm khám</p>
        </article>
        <article className="dentist-stat-card">
          <span>Bệnh án chờ xác nhận</span>
          <strong>{pendingRecords.length}</strong>
          <p>Cần kiểm tra nội dung</p>
        </article>
        <article className="dentist-stat-card highlight">
          <span>Hồ sơ cần cập nhật</span>
          <strong>{needRecordAppointments.length}</strong>
          <p>Lịch đã xác nhận chưa có hồ sơ</p>
        </article>
      </section>

      <section className="dentist-work-grid">
        <div className="dentist-work-panel main">
          <div className="dentist-work-panel-header">
            <div>
              <h3>Lịch khám tiếp theo</h3>
              <p>Ưu tiên các lịch gần nhất đã được phân công cho bạn.</p>
            </div>
            <Link to="/dentist/appointments">Xem tất cả</Link>
          </div>

          <div className="dentist-timeline">
            {upcomingAppointments.length === 0 && (
              <div className="dentist-empty-state compact">
                <strong>Chưa có lịch sắp tới</strong>
                <p>Khi lễ tân phân công lịch, danh sách sẽ hiển thị tại đây.</p>
              </div>
            )}
            {upcomingAppointments.map((appointment) => (
              <article className="dentist-timeline-item" key={appointment.id}>
                <time>
                  <strong>{formatTime(appointment.appointment_time)}</strong>
                  <span>{formatDate(appointment.appointment_date)}</span>
                </time>
                <div>
                  <strong>{appointment.patient_name}</strong>
                  <span>{appointment.patient_phone || "Chưa có SĐT"}</span>
                  <p>{appointment.service_name}</p>
                  {appointment.note && <small>{appointment.note}</small>}
                </div>
                <span className={`dentist-status ${STATUS_CLASSES[appointment.status] || "pending"}`}>
                  {STATUS_LABELS[appointment.status] || appointment.status}
                </span>
                <Link to="/dentist/appointments" className="dentist-small-button secondary">
                  {appointment.has_medical_record ? "Mở bệnh án" : "Cập nhật điều trị"}
                </Link>
              </article>
            ))}
          </div>
        </div>

        <aside className="dentist-work-panel">
          <div className="dentist-work-panel-header">
            <div>
              <h3>Bệnh án cần xử lý</h3>
              <p>Hồ sơ đang chờ xác nhận hoặc cần bổ sung.</p>
            </div>
          </div>
          <div className="dentist-task-list">
            {pendingRecords.length === 0 && (
              <p className="dentist-muted-text">Không có bệnh án chờ xác nhận.</p>
            )}
            {pendingRecords.slice(0, 5).map((record) => (
              <Link to="/dentist/medical-records" key={record.id}>
                <strong>{record.patient_name}</strong>
                <span>{record.created_at ? new Date(record.created_at).toLocaleDateString("vi-VN") : "Chưa rõ ngày"}</span>
                <small>{record.diagnosis || record.treatment || "Cần kiểm tra nội dung"}</small>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="dentist-work-panel">
        <div className="dentist-work-panel-header">
          <div>
            <h3>Lịch tái khám gần nhất</h3>
            <p>Nhắc bệnh nhân quay lại theo đề xuất điều trị.</p>
          </div>
          <Link to="/dentist/medical-records">Mở hồ sơ</Link>
        </div>
        <div className="dentist-reexam-list">
          {upcomingReExams.length === 0 && (
            <p className="dentist-muted-text">Chưa có lịch tái khám sắp tới.</p>
          )}
          {upcomingReExams.map((record) => (
            <article key={record.id}>
              <strong>{record.patient_name}</strong>
              <span>{record.patient_phone || "Chưa có SĐT"}</span>
              <p>{formatDate(record.re_examination_date)} lúc {formatTime(record.re_examination_time)}</p>
              <small>{record.treatment_plan || record.note || "Theo dõi sau điều trị"}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DentistDashboard;
