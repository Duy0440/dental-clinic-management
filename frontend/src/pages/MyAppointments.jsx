import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const STATUS_CLASSES = {
  Pending: "text-bg-warning",
  Confirmed: "text-bg-primary",
  Completed: "text-bg-success",
  Cancelled: "text-bg-secondary",
};

function formatDate(dateString) {
  if (!dateString) {
    return "Chưa cập nhật";
  }

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(timeString) {
  if (!timeString) {
    return "Chưa cập nhật";
  }

  return timeString.slice(0, 5);
}

function MyAppointments() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axiosClient.get(
          `/appointments/history/${user.patient_id}`,
        );
        setAppointments(response.data.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || "Không thể tải lịch đã đặt");
      } finally {
        setLoading(false);
      }
    };

    if (user?.patient_id) {
      fetchAppointments();
      return;
    }

    setLoading(false);
    setMessage("Tài khoản này chưa có hồ sơ bệnh nhân");
  }, [user?.patient_id]);

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy lịch hẹn này không?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await axiosClient.patch(
        `/appointments/${appointmentId}/cancel`,
      );

      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: response.data.data.status }
            : appointment,
        ),
      );

      setMessage("Hủy lịch thành công");
    } catch (error) {
      setMessage(error.response?.data?.message || "Không thể hủy lịch");
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1">Lịch đã đặt</h2>
          <p className="text-secondary mb-0">
            Khách hàng có thể xem lại các lịch khám đã tạo trong tài khoản.
          </p>
        </div>

        <Link to="/booking" className="btn btn-primary">
          Đặt lịch mới
        </Link>
      </div>

      {loading && <p className="text-center">Đang tải lịch khám...</p>}

      {!loading && message && (
        <div className="alert alert-warning rounded-4">{message}</div>
      )}

      {!loading && !message && appointments.length === 0 && (
        <div className="alert alert-light border rounded-4 text-center">
          Bạn chưa có lịch khám nào.
        </div>
      )}

      {!loading && appointments.length > 0 && (
        <div className="row g-4">
          {appointments.map((appointment) => {
            const canCancel =
              appointment.status === "Pending" ||
              appointment.status === "Confirmed";

            return (
              <div className="col-lg-6" key={appointment.id}>
                <div className="card border-0 shadow-sm rounded-4 h-100">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                      <div>
                        <p className="text-uppercase text-secondary small mb-1">
                          Lịch khám #{appointment.id}
                        </p>
                        <h4 className="mb-1">{appointment.service_name}</h4>
                        <p className="text-secondary mb-0">
                          Nha sĩ phụ trách:{" "}
                          {appointment.dentist_name || "Phòng khám chưa phân công"}
                        </p>
                      </div>

                      <span
                        className={`badge rounded-pill px-3 py-2 ${
                          STATUS_CLASSES[appointment.status] || "text-bg-light"
                        }`}
                      >
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </span>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-sm-6">
                        <div className="border rounded-4 p-3 h-100 bg-light-subtle">
                          <p className="text-secondary mb-1">Ngày khám</p>
                          <strong>{formatDate(appointment.appointment_date)}</strong>
                        </div>
                      </div>

                      <div className="col-sm-6">
                        <div className="border rounded-4 p-3 h-100 bg-light-subtle">
                          <p className="text-secondary mb-1">Giờ khám</p>
                          <strong>{formatTime(appointment.appointment_time)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-4 p-3 mb-3">
                      <p className="text-secondary mb-1">Ghi chú</p>
                      <p className="mb-0">
                        {appointment.note || "Không có ghi chú thêm."}
                      </p>
                    </div>

                    {appointment.clinic_note && (
                    <div className="alert alert-info rounded-4">
                    <strong>Thông báo từ phòng khám</strong>
                    <p className="mb-0 mt-1">{appointment.clinic_note}</p>
                     </div>
                    )}       
                    {canCancel && (
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Hủy lịch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyAppointments;