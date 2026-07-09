import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

const TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

function Booking() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [dentists, setDentists] = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    guest_full_name: "",
    guest_phone: "",
    dentist_id: "",
    service_id: "",
    appointment_date: "",
    appointment_time: "",
    note: "",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const [dentistResponse, serviceResponse] = await Promise.all([
          axiosClient.get("/dentists/active"),
          axiosClient.get("/services"),
        ]);

        setDentists(dentistResponse.data.data || []);
        setServices(serviceResponse.data.data || []);
      } catch (error) {
        setMessage("Không thể tải dữ liệu đặt lịch");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSuccess(false);

    try {
      const payload = {
        service_id: Number(formData.service_id),
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        note: formData.note,
      };

      if (formData.dentist_id) {
        payload.dentist_id = Number(formData.dentist_id);
      }

      if (user?.patient_id) {
        payload.patient_id = user.patient_id;
      } else {
        payload.guest_full_name = formData.guest_full_name;
        payload.guest_phone = formData.guest_phone;
      }

      const response = await axiosClient.post("/appointments", payload);

      setIsSuccess(true);
      setMessage("Cuộc hẹn đã được tạo thành công");

      setFormData({
        guest_full_name: "",
        guest_phone: "",
        dentist_id: "",
        service_id: "",
        appointment_date: "",
        appointment_time: "",
        note: "",
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Lỗi máy chủ");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body p-4 p-lg-5">
              <h2 className="mb-2 text-center">Đặt lịch khám</h2>
              <p className="text-center text-secondary mb-4">
                Khách hàng có thể đặt lịch trực tiếp trên website. Nếu có tài
                khoản, bạn có thể xem lại lịch đã đặt, kết quả khám và nhận ưu
                đãi sau này.
              </p>

              {user?.patient_id ? (
                <div className="alert alert-light border rounded-4 mb-4">
                  <strong>Tài khoản:</strong> {user.username}
                  <br />
                  <strong>Vai trò:</strong> Khách hàng
                  <br />
                  <strong>Mã bệnh nhân:</strong> {user.patient_id}
                </div>
              ) : (
                <div className="alert alert-info rounded-4 mb-4">
                  Bạn có thể đặt lịch mà không cần tài khoản. Nếu muốn xem lại
                  lịch đã đặt, kết quả khám và nhận ưu đãi, bạn nên đăng ký tài
                  khoản sau.
                </div>
              )}

              {!loading && dentists.length === 1 && (
                <div className="alert alert-info rounded-4 mb-4">
                  Hiện tại dữ liệu mẫu mới có 1 nha sĩ. Sau này phần quản trị sẽ
                  cho phép thêm nhiều nha sĩ hơn.
                </div>
              )}

              {loading ? (
                <p className="text-center mb-0">Đang tải dữ liệu đặt lịch...</p>
              ) : (
                <form onSubmit={handleSubmit}>
                  {!user?.patient_id && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Họ và tên</label>
                        <input
                          type="text"
                          name="guest_full_name"
                          className="form-control"
                          value={formData.guest_full_name}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label">Số điện thoại</label>
                        <input
                          type="text"
                          name="guest_phone"
                          className="form-control"
                          value={formData.guest_phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Chọn nha sĩ</label>
                      <select
                        name="dentist_id"
                        className="form-select"
                        value={formData.dentist_id}
                        onChange={handleChange}
                      >
                        <option value="">Không chọn bác sĩ cụ thể</option>
                        {dentists.map((dentist) => (
                          <option key={dentist.id} value={dentist.id}>
                            {dentist.full_name}
                            {dentist.specialty ? ` - ${dentist.specialty}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Chọn dịch vụ</label>
                      <select
                        name="service_id"
                        className="form-select"
                        value={formData.service_id}
                        onChange={handleChange}
                      >
                        <option value="">Chọn dịch vụ</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.service_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Ngày khám</label>
                      <input
                        type="date"
                        name="appointment_date"
                        className="form-control"
                        value={formData.appointment_date}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Giờ khám</label>
                      <select
                        name="appointment_time"
                        className="form-select"
                        value={formData.appointment_time}
                        onChange={handleChange}
                      >
                        <option value="">Chọn giờ khám</option>
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Ghi chú</label>
                    <textarea
                      name="note"
                      className="form-control"
                      rows="3"
                      value={formData.note}
                      onChange={handleChange}
                      placeholder="Ví dụ: đau răng hàm dưới, muốn khám buổi sáng..."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Xác nhận đặt lịch
                  </button>
                </form>
              )}

              {message && (
                <p
                  className={`mt-3 text-center mb-0 ${
                    isSuccess ? "text-success" : "text-danger"
                  }`}
                >
                  {message}
                </p>
              )}

              {user?.patient_id && (
                <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
                  <Link
                    to="/my-appointments"
                    className="btn btn-outline-secondary"
                  >
                    Xem lịch đã đặt
                  </Link>
                  <Link
                    to="/medical-results"
                    className="btn btn-outline-secondary"
                  >
                    Xem kết quả khám
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
