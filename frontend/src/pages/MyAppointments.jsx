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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [appointmentResponse, reviewResponse] = await Promise.all([
          axiosClient.get(`/appointments/history/${user.patient_id}`),
          axiosClient.get("/reviews/mine"),
        ]);

        setAppointments(appointmentResponse.data.data || []);
        setReviews(reviewResponse.data.data || []);
      } catch (error) {
        setMessage(error.response?.data?.message || "Không thể tải lịch đã đặt");
      } finally {
        setLoading(false);
      }
    };

    if (user?.patient_id) {
      fetchCustomerData();
      return;
    }

    setLoading(false);
    setMessage("Tài khoản này chưa có hồ sơ khách hàng");
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

  const openReviewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRating(5);
    setComment("");
    setReviewMessage("");
  };

  const closeReviewModal = () => {
    setSelectedAppointment(null);
    setReviewMessage("");
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();

    if (!selectedAppointment) {
      return;
    }

    try {
      const response = await axiosClient.post("/reviews", {
        patient_id: selectedAppointment.patient_id,
        service_id: selectedAppointment.service_id,
        appointment_id: selectedAppointment.id,
        rating,
        comment,
      });

      setReviews((prevReviews) => [...prevReviews, response.data.data]);
      setMessage("Cảm ơn bạn đã gửi đánh giá cho phòng khám.");
      closeReviewModal();
    } catch (error) {
      setReviewMessage(
        error.response?.data?.message || "Không thể gửi đánh giá lúc này",
      );
    }
  };

  const hasReviewedService = (serviceId) => {
    return reviews.some((review) => Number(review.service_id) === Number(serviceId));
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="mb-1">Lịch đã đặt</h2>
          <p className="text-secondary mb-0">
            Khách hàng có thể xem lại lịch khám, hủy lịch khi cần và đánh giá
            dịch vụ sau khi hoàn thành điều trị.
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
            const canReview = appointment.status === "Completed";
            const reviewed = hasReviewedService(appointment.service_id);

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

                    <div className="d-grid gap-2">
                      {canCancel && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Hủy lịch
                        </button>
                      )}

                      {canReview && !reviewed && (
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => openReviewModal(appointment)}
                        >
                          Đánh giá dịch vụ
                        </button>
                      )}

                      {canReview && reviewed && (
                        <span className="badge text-bg-success rounded-pill py-2">
                          Đã đánh giá dịch vụ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAppointment && (
        <div className="modal-backdrop-custom">
          <div className="modal-card-custom">
            <button
              type="button"
              className="modal-close-btn"
              onClick={closeReviewModal}
            >
              ×
            </button>

            <h3 className="mb-2">Đánh giá dịch vụ</h3>
            <p className="text-secondary">
              Dịch vụ: <strong>{selectedAppointment.service_name}</strong>
            </p>

            {reviewMessage && (
              <div className="alert alert-danger rounded-4">{reviewMessage}</div>
            )}

            <form onSubmit={handleSubmitReview}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Số sao</label>
                <select
                  className="form-select"
                  value={rating}
                  onChange={(event) => setRating(Number(event.target.value))}
                >
                  <option value={5}>5 sao - Rất hài lòng</option>
                  <option value={4}>4 sao - Hài lòng</option>
                  <option value={3}>3 sao - Bình thường</option>
                  <option value={2}>2 sao - Chưa hài lòng</option>
                  <option value={1}>1 sao - Cần cải thiện</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Nhận xét</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Ví dụ: bác sĩ tư vấn rõ ràng, lễ tân hỗ trợ tốt..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Gửi đánh giá
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAppointments;
