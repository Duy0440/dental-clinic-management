import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    dentist_id: "",
    status: "Pending",
    clinic_note: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appointmentResponse, dentistResponse] = await Promise.all([
          axiosClient.get("/appointments"),
          axiosClient.get("/dentists"),
        ]);

        setAppointments(appointmentResponse.data.data || []);
        setDentists(dentistResponse.data.data || []);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Không thể tải dữ liệu.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const openManageForm = (appointment) => {
    setSelectedAppointment(appointment);
    setErrorMessage("");
    setSuccessMessage("");

    setFormData({
      dentist_id: appointment.dentist_id || "",
      status: appointment.status,
      clinic_note: appointment.clinic_note || "",
    });
  };

  const closeManageForm = () => {
    setSelectedAppointment(null);
  };

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const dentistId = formData.dentist_id
        ? Number(formData.dentist_id)
        : null;

      await axiosClient.patch(`/appointments/${selectedAppointment.id}/admin`, {
        dentist_id: dentistId,
        status: formData.status,
        clinic_note: formData.clinic_note,
      });

      const selectedDentist = dentists.find(
        (dentist) => dentist.id === dentistId,
      );

      setAppointments((currentAppointments) =>
        currentAppointments.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? {
                ...appointment,
                dentist_id: dentistId,
                dentist_name: selectedDentist?.full_name || null,
                status: formData.status,
                clinic_note: formData.clinic_note,
              }
            : appointment,
        ),
      );

      setSuccessMessage("Cập nhật lịch hẹn thành công.");
      closeManageForm();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể cập nhật lịch hẹn.",
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredAppointments =
    statusFilter === "All"
      ? appointments
      : appointments.filter(
          (appointment) => appointment.status === statusFilter,
        );

  const formatDate = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => (time ? time.slice(0, 5) : "");

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Danh sách lịch hẹn</h2>
          <p>Xác nhận lịch, phân công nha sĩ và gửi thông báo cho khách.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Pending">Chờ xác nhận</option>
          <option value="Confirmed">Đã xác nhận</option>
          <option value="Completed">Đã hoàn thành</option>
          <option value="Cancelled">Đã hủy</option>
        </select>
      </div>

      {successMessage && (
        <p className="admin-success-message">{successMessage}</p>
      )}

      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {loading && <p>Đang tải danh sách lịch hẹn...</p>}

      {!loading && filteredAppointments.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã lịch</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Ngày giờ</th>
                <th>Nha sĩ</th>
                <th>Trạng thái</th>
                <th>Xử lý</th>
              </tr>
            </thead>

            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>#{appointment.id}</td>

                  <td>
                    <strong>{appointment.patient_name}</strong>
                    <span>{appointment.patient_phone}</span>
                  </td>

                  <td>{appointment.service_name}</td>

                  <td>
                    {formatDate(appointment.appointment_date)}
                    <span>{formatTime(appointment.appointment_time)}</span>
                  </td>

                  <td>{appointment.dentist_name || "Chưa phân công"}</td>

                  <td>
                    <span
                      className={`appointment-status ${appointment.status.toLowerCase()}`}
                    >
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="admin-action-button"
                      disabled={["Completed", "Cancelled"].includes(
                        appointment.status,
                      )}
                      onClick={() => openManageForm(appointment)}
                    >
                      Xử lý
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAppointment && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Xử lý lịch #{selectedAppointment.id}</h3>
                <p>{selectedAppointment.patient_name}</p>
              </div>

              <button type="button" onClick={closeManageForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Phân công nha sĩ
                <select
                  name="dentist_id"
                  value={formData.dentist_id}
                  onChange={handleChange}
                >
                  <option value="">Chưa phân công</option>

                  {dentists.map((dentist) => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.full_name} - {dentist.specialty}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Trạng thái
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Pending">Chờ xác nhận</option>
                  <option value="Confirmed">Xác nhận lịch</option>
                  <option value="Cancelled">Hủy lịch</option>
                </select>
              </label>

              <label>
                Ghi chú gửi khách hàng
                <textarea
                  name="clinic_note"
                  rows="4"
                  value={formData.clinic_note}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nha sĩ khách chọn đang bận, phòng khám đã phân công nha sĩ khác thay thế."
                />
              </label>

              <div className="admin-modal-actions">
                <button type="button" onClick={closeManageForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppointments;
