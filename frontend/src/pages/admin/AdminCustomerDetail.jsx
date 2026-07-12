import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { getAssetUrl } from "../../api/urlHelpers";
import MedicalRecordForm from "../../components/admin/MedicalRecordForm";

const getTodayText = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialAppointmentForm = {
  dentist_id: "",
  service_id: "",
  appointment_date: "",
  appointment_time: "",
  note: "",
};

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

function AdminCustomerDetail() {
  const { customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [services, setServices] = useState([]);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(initialAppointmentForm);
  const [loading, setLoading] = useState(true);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [availableAppointmentTimes, setAvailableAppointmentTimes] = useState([]);
  const [loadingAppointmentTimes, setLoadingAppointmentTimes] = useState(false);
  const [appointmentTimeMessage, setAppointmentTimeMessage] = useState(
    "Chọn ngày hẹn để hệ thống kiểm tra giờ còn trống.",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const todayText = getTodayText();
  const assignableDentists = dentists.filter(
    (dentist) => dentist.is_active !== false && dentist.user_is_active !== false,
  );


  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const [
          customerResponse,
          appointmentResponse,
          recordResponse,
          dentistResponse,
          serviceResponse,
        ] = await Promise.all([
          axiosClient.get(`/patients/${customerId}`),
          axiosClient.get(`/appointments/history/${customerId}`),
          axiosClient.get(`/medical-records/patient/${customerId}`),
          axiosClient.get("/dentists"),
          axiosClient.get("/services/admin"),
        ]);

        setCustomer(customerResponse.data.data);
        setAppointments(appointmentResponse.data.data || []);
        setMedicalRecords(recordResponse.data.data || []);
        setDentists(dentistResponse.data.data || []);
        setServices(serviceResponse.data.data || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải hồ sơ khách hàng.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const refreshMedicalRecords = async () => {
    const response = await axiosClient.get(
      `/medical-records/patient/${customerId}`,
    );

    setMedicalRecords(response.data.data || []);
    setShowRecordForm(false);
  };

  const refreshAppointments = async () => {
    const response = await axiosClient.get(`/appointments/history/${customerId}`);
    setAppointments(response.data.data || []);
  };

  const closeAppointmentForm = () => {
    setAppointmentForm(initialAppointmentForm);
    setAvailableAppointmentTimes([]);
    setAppointmentTimeMessage("Chọn ngày hẹn để hệ thống kiểm tra giờ còn trống.");
    setShowAppointmentForm(false);
  };

  const handleAppointmentChange = (event) => {
    const { name, value } = event.target;

    setAppointmentForm((current) => {
      if (name === "appointment_date" || name === "dentist_id") {
        return {
          ...current,
          [name]: value,
          appointment_time: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  useEffect(() => {
    const fetchAvailableAppointmentTimes = async () => {
      if (!showAppointmentForm) {
        return;
      }

      if (!appointmentForm.appointment_date) {
        setAvailableAppointmentTimes([]);
        setAppointmentTimeMessage("Chọn ngày hẹn để hệ thống kiểm tra giờ còn trống.");
        return;
      }

      setLoadingAppointmentTimes(true);

      try {
        const params = new URLSearchParams({
          date: appointmentForm.appointment_date,
        });

        if (appointmentForm.dentist_id) {
          params.append("dentist_id", appointmentForm.dentist_id);
        }

        const response = await axiosClient.get(
          `/appointments/available-times?${params.toString()}`,
        );
        const times = response.data.data?.available_times || [];
        const apiMessage = response.data.data?.message;

        setAvailableAppointmentTimes(times);
        setAppointmentTimeMessage(
          apiMessage ||
            (times.length
              ? `Còn ${times.length} khung giờ có thể tạo lịch.`
              : "Ngày này đã hết giờ nhận lịch online, vui lòng chọn ngày khác."),
        );
        setAppointmentForm((current) =>
          current.appointment_time && !times.includes(current.appointment_time)
            ? { ...current, appointment_time: "" }
            : current,
        );
      } catch (error) {
        setAvailableAppointmentTimes([]);
        setAppointmentTimeMessage(
          error.response?.data?.message ||
            "Không thể kiểm tra giờ trống, vui lòng thử lại.",
        );
        setAppointmentForm((current) =>
          current.appointment_time ? { ...current, appointment_time: "" } : current,
        );
      } finally {
        setLoadingAppointmentTimes(false);
      }
    };

    fetchAvailableAppointmentTimes();
  }, [showAppointmentForm, appointmentForm.appointment_date, appointmentForm.dentist_id]);

  const handleCreateAppointment = async (event) => {
    event.preventDefault();
    setSavingAppointment(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!availableAppointmentTimes.includes(appointmentForm.appointment_time)) {
        setErrorMessage(
          availableAppointmentTimes.length
            ? "Khung giờ này không còn trống. Vui lòng chọn một giờ còn trống."
            : "Ngày này đã hết giờ phù hợp. Vui lòng chọn ngày khác.",
        );
        setSavingAppointment(false);
        return;
      }

      await axiosClient.post("/appointments", {
        patient_id: Number(customerId),
        dentist_id: appointmentForm.dentist_id
          ? Number(appointmentForm.dentist_id)
          : null,
        service_id: Number(appointmentForm.service_id),
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        status: "Pending",
        note:
          appointmentForm.note ||
          "Lich hen tiep theo duoc tao tu ho so khach hang.",
      });

      setSuccessMessage("Đã tạo lịch hẹn mới cho khách hàng.");
      closeAppointmentForm();
      await refreshAppointments();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tạo lịch hẹn mới.",
      );
    } finally {
      setSavingAppointment(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "Chưa cập nhật";

    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : "";
  };

  if (loading) {
    return <div className="admin-page">Đang tải hồ sơ khách hàng...</div>;
  }

  if (errorMessage || !customer) {
    return (
      <div className="admin-page admin-error-message">
        {errorMessage || "Không tìm thấy khách hàng."}
      </div>
    );
  }

    const getFileUrl = (fileUrl) => {
     return getAssetUrl(fileUrl);
    };

    const isImageFile = (fileType) => {
     return fileType?.startsWith("image/");
    };

  return (
    <div className="admin-customer-detail">
      <section className="admin-page">
        <Link to="/admin/customers" className="admin-back-link">
          ← Quay lại danh sách
        </Link>

        <div className="admin-page-header">
          <div>
            <h2>{customer.full_name}</h2>
            <p>Hồ sơ khách hàng #{customer.id}</p>
          </div>

          <span className="customer-account-type">
            {customer.user_id ? "Có tài khoản" : "Khách vãng lai"}
          </span>
        </div>

        <div className="customer-information-grid">
          <div>
            <span>Số điện thoại</span>
            <strong>{customer.phone}</strong>
          </div>

          <div>
            <span>Giới tính</span>
            <strong>{customer.gender || "Chưa cập nhật"}</strong>
          </div>

          <div>
            <span>Ngày sinh</span>
            <strong>{customer.birth_date_display || "Chưa cập nhật"}</strong>
          </div>

          <div>
            <span>Địa chỉ</span>
            <strong>{customer.address || "Chưa cập nhật"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Lịch hẹn</h2>
            <p>Lịch sử và lịch sắp tới của khách hàng.</p>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setShowAppointmentForm(true)}
          >
            Tạo lịch mới
          </button>
        </div>

        {successMessage && <p className="admin-success-message">{successMessage}</p>}

        {appointments.length === 0 ? (
          <p>Khách hàng chưa có lịch hẹn.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày khám</th>
                  <th>Dịch vụ</th>
                  <th>Nha sĩ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {formatDate(appointment.appointment_date)}
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </td>

                    <td>{appointment.service_name}</td>

                    <td>{appointment.dentist_name || "Chưa phân công"}</td>

                    <td>
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <h2>Kết quả điều trị</h2>
            <p>Thông tin khám, điều trị và khuyến nghị tái khám.</p>
          </div>

          <button
            type="button"
            className="admin-primary-button"
            onClick={() => setShowRecordForm(true)}
          >
            Thêm kết quả
          </button>
        </div>

        {medicalRecords.length === 0 ? (
          <p>Khách hàng chưa có kết quả điều trị.</p>
        ) : (
          <div className="medical-record-list">
            {medicalRecords.map((record) => (
              <article className="medical-record-card" key={record.id}>
                <div>
                  <span>Nha sĩ phụ trách</span>
                  <strong>{record.dentist_name}</strong>
                </div>

                <div>
                  <span>Chẩn đoán</span>
                  <p>{record.diagnosis || "Chưa cập nhật"}</p>
                </div>

                <div>
                  <span>Điều trị</span>
                  <p>{record.treatment || "Chưa cập nhật"}</p>
                </div>

                <div>
                  <span>Tái khám đề xuất</span>
                  <strong>
                    {record.re_examination_date_display ||
                      "Chưa có lịch tái khám"}
                  </strong>

                  {record.re_examination_time && (
                    <p>{formatTime(record.re_examination_time)}</p>
                  )}
                </div>

                <div>
                  <span>Người nhập dữ liệu</span>

                  {record.attachments?.length > 0 && (
                    <div className="medical-record-attachments">
                      <span>Hình ảnh / tài liệu</span>

                      <div className="record-attachment-list">
                        {record.attachments.map((file) => (
                          <div className="record-attachment-item" key={file.id}>
                            {isImageFile(file.file_type) ? (
                              <button
                                type="button"
                                className="record-image-button"
                                onClick={() =>
                                  setPreviewImage(getFileUrl(file.file_url))
                                }
                              >
                                <img
                                  src={getFileUrl(file.file_url)}
                                  alt={file.file_name}
                                />
                              </button>
                            ) : (
                              <a
                                href={getFileUrl(file.file_url)}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-action-button"
                              >
                                Xem file
                              </a>
                            )}

                            <small>{file.file_name}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <strong>
                    {record.entered_by_username || "Chưa xác định"}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showRecordForm && (
        <MedicalRecordForm
          customerId={customerId}
          appointments={appointments}
          dentists={dentists}
          onClose={() => setShowRecordForm(false)}
          onCreated={refreshMedicalRecords}
        />
      )}

      {showAppointmentForm && (
        <div className="admin-modal-overlay">
          <form className="admin-modal" onSubmit={handleCreateAppointment}>
            <div className="admin-modal-header">
              <div>
                <h3>Tạo lịch hẹn mới</h3>
                <p>
                  Hẹn lần tiếp theo cho <strong>{customer.full_name}</strong>.
                </p>
              </div>

              <button type="button" onClick={closeAppointmentForm}>
                ×
              </button>
            </div>

            <div className="booking-time-panel admin-booking-time-panel">
              <div className="booking-time-panel-header">
                <strong>Khung giờ còn trống</strong>
                <span>
                  {appointmentForm.dentist_id
                    ? "Theo nha sĩ đã chọn"
                    : "Theo toàn bộ nha sĩ đang nhận lịch"}
                </span>
              </div>
              <p
                className={`booking-time-message ${
                  availableAppointmentTimes.length ? "is-ok" : "is-warning"
                }`}
              >
                {appointmentTimeMessage}
              </p>
              {availableAppointmentTimes.length > 0 && (
                <div className="booking-time-grid">
                  {availableAppointmentTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`booking-time-chip ${
                        appointmentForm.appointment_time === time ? "active" : ""
                      }`}
                      onClick={() =>
                        setAppointmentForm((current) => ({
                          ...current,
                          appointment_time: time,
                        }))
                      }
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label>
              Dịch vụ
              <select
                required
                name="service_id"
                value={appointmentForm.service_id}
                onChange={handleAppointmentChange}
              >
                <option value="">Chọn dịch vụ</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.service_name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Nha sĩ phụ trách
              <select
                name="dentist_id"
                value={appointmentForm.dentist_id}
                onChange={handleAppointmentChange}
              >
                <option value="">Để lễ tân phân công sau</option>
                {assignableDentists.map((dentist) => (
                  <option key={dentist.id} value={dentist.id}>
                    {dentist.full_name} - {dentist.specialty}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-form-grid two-columns">
              <label>
                Ngày hẹn
                <input
                  required
                  type="date"
                  name="appointment_date"
                  value={appointmentForm.appointment_date}
                  min={todayText}
                  onChange={handleAppointmentChange}
                />
              </label>

              <label>
                Giờ hẹn
                <select
                  required
                  name="appointment_time"
                  value={appointmentForm.appointment_time}
                  onChange={handleAppointmentChange}
                  disabled={
                    !appointmentForm.appointment_date ||
                    loadingAppointmentTimes ||
                    availableAppointmentTimes.length === 0
                  }
                >
                  <option value="">Chọn giờ</option>
                  {availableAppointmentTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              Ghi chú
              <textarea
                name="note"
                rows="3"
                value={appointmentForm.note}
                onChange={handleAppointmentChange}
                placeholder="Ví dụ: tái khám sau điều trị tủy, kiểm tra mão sứ..."
              />
            </label>

            {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

            <div className="admin-modal-actions">
              <button type="button" onClick={closeAppointmentForm}>
                Đóng
              </button>

              <button type="submit" disabled={savingAppointment}>
                {savingAppointment ? "Đang tạo..." : "Tạo lịch hẹn"}
              </button>
            </div>
          </form>
        </div>
      )}

      {previewImage && (
        <div
          className="image-preview-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="image-preview-close"
            onClick={() => setPreviewImage(null)}
          >
            ×
          </button>

          <img src={previewImage} alt="Hình ảnh điều trị" />
        </div>
      )}
    </div>
  );
}

export default AdminCustomerDetail;
