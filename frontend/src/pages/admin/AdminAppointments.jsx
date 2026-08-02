// admin xem va xu ly lich hen
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const STATUS_LABELS = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Completed: "Đã hoàn thành",
  Cancelled: "Đã hủy",
};

const getTodayText = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// admin appointments page (le tan quan ly va xac nhan lich hen)
function AdminAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    appointment_date: "",
    appointment_time: "",
    dentist_id: "",
    status: "Pending",
    clinic_note: "",
  });

  const [createFormData, setCreateFormData] = useState({
    patient_id: "",
    dentist_id: "",
    service_id: "",
    appointment_date: "",
    appointment_time: "",
    status: "Pending",
    note: "",
  });

  // load appointments (tai lai danh sach lich hen)
  const loadAppointments = async () => {
    const response = await axiosClient.get("/appointments");
    setAppointments(response.data.data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          appointmentResponse,
          dentistResponse,
          patientResponse,
          serviceResponse,
        ] = await Promise.all([
          axiosClient.get("/appointments"),
          axiosClient.get("/dentists"),
          axiosClient.get("/patients"),
          axiosClient.get("/services/admin"),
        ]);

        setAppointments(appointmentResponse.data.data || []);
        setDentists(dentistResponse.data.data || []);
        setPatients(patientResponse.data.data || []);
        setServices(serviceResponse.data.data || []);
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

  useEffect(() => {
    if (searchParams.get("mode") !== "create") return;

    setCreateFormData({
      patient_id: searchParams.get("patient_id") || "",
      dentist_id: searchParams.get("dentist_id") || "",
      service_id: searchParams.get("service_id") || "",
      appointment_date: searchParams.get("appointment_date") || "",
      appointment_time: "",
      status: "Pending",
      note: searchParams.get("note") || "",
    });
    setSelectedAppointment(null);
    setIsCreateOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  }, [searchParams]);

  // open manage form (mo popup xu ly lich)
  const openManageForm = (appointment) => {
    setSelectedAppointment(appointment);
    setErrorMessage("");
    setSuccessMessage("");

    setFormData({
      appointment_date: appointment.appointment_date || "",
      appointment_time: appointment.appointment_time?.slice(0, 5) || "",
      dentist_id: appointment.dentist_id || "",
      status: appointment.status,
      clinic_note: appointment.clinic_note || "",
    });
  };

  const closeManageForm = () => {
    setSelectedAppointment(null);
  };

  const openCreateForm = () => {
    setCreateFormData({
      patient_id: "",
      dentist_id: "",
      service_id: "",
      appointment_date: "",
      appointment_time: "",
      status: "Pending",
      note: "",
    });
    setSelectedAppointment(null);
    setIsCreateOpen(true);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const closeCreateForm = () => {
    setIsCreateOpen(false);
    if (searchParams.get("mode") === "create") {
      setSearchParams({}, { replace: true });
    }
  };

  // handle form change (cap nhat ngay gio, nha si, trang thai, ghi chu)
  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "dentist_id") {
      const oldDentistId = selectedAppointment?.dentist_id
        ? String(selectedAppointment.dentist_id)
        : "";

      const selectedDentist = dentists.find(
        (dentist) => String(dentist.id) === String(value),
      );

      const shouldSuggestNote =
        oldDentistId &&
        value &&
        oldDentistId !== String(value) &&
        !formData.clinic_note;

      setFormData({
        ...formData,
        dentist_id: value,
        clinic_note: shouldSuggestNote
          ? `Phòng khám đã chuyển lịch sang ${selectedDentist?.full_name} phụ trách để hỗ trợ khách hàng đúng thời gian.`
          : formData.clinic_note,
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCreateChange = (event) => {
    const { name, value } = event.target;

    setCreateFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // update appointment (xac nhan/huy/phan cong nha si)
  const updateAppointment = async (forceAssign = false) => {
    const dentistId = formData.dentist_id ? Number(formData.dentist_id) : null;

    const response = await axiosClient.patch(`/appointments/${selectedAppointment.id}/admin`, {
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      dentist_id: dentistId,
      status: formData.status,
      clinic_note: formData.clinic_note,
      force_assign: forceAssign,
    });

    const updatedAppointment = response.data.data;
    const selectedDentist = dentists.find(
      (dentist) => Number(dentist.id) === Number(updatedAppointment.dentist_id),
    );

    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.id === selectedAppointment.id
          ? {
              ...appointment,
              ...updatedAppointment,
              appointment_date:
                updatedAppointment.appointment_date || appointment.appointment_date,
              appointment_time:
                updatedAppointment.appointment_time || appointment.appointment_time,
              patient_name: appointment.patient_name,
              patient_phone: appointment.patient_phone,
              service_name: appointment.service_name,
              dentist_id: updatedAppointment.dentist_id,
              dentist_name: selectedDentist?.full_name || null,
            }
          : appointment,
      ),
    );

    await loadAppointments();
    window.dispatchEvent(new Event("admin-sidebar-alerts-refresh"));
  };

  // submit appointment (luu thay doi lich hen)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateAppointment(false);

      setSuccessMessage("Cập nhật lịch hẹn thành công.");
      closeManageForm();
    } catch (error) {
      const errorCode = error.response?.data?.code;

      if (error.response?.status === 409 && errorCode === "DENTIST_UNAVAILABLE") {
        const confirmOverride = window.confirm(
          "Nha sĩ này đã báo bận trong khung giờ này. Bạn vẫn muốn phân công nha sĩ này cho khách không?",
        );

        if (confirmOverride) {
          try {
            await updateAppointment(true);
            setSuccessMessage(
              "Đã phân công nha sĩ theo quyết định của phòng khám.",
            );
            closeManageForm();
          } catch (overrideError) {
            setErrorMessage(
              overrideError.response?.data?.message ||
                "Không thể cập nhật lịch hẹn.",
            );
          }
        }
      } else {
        setErrorMessage(
          error.response?.data?.message || "Không thể cập nhật lịch hẹn.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // tao lich hen tu popup admin
  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await axiosClient.post("/appointments", {
        patient_id: Number(createFormData.patient_id),
        dentist_id: createFormData.dentist_id
          ? Number(createFormData.dentist_id)
          : null,
        service_id: Number(createFormData.service_id),
        appointment_date: createFormData.appointment_date,
        appointment_time: createFormData.appointment_time,
        status: createFormData.status,
        note: createFormData.note,
      });

      await loadAppointments();
      window.dispatchEvent(new Event("admin-sidebar-alerts-refresh"));
      setSuccessMessage("Tạo lịch hẹn thành công.");
      closeCreateForm();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tạo lịch hẹn.",
      );
    } finally {
      setSaving(false);
    }
  };

  // filter appointments (loc lich theo trang thai)
  const filteredAppointments =
    statusFilter === "All"
      ? appointments
      : appointments.filter(
          (appointment) => appointment.status === statusFilter,
        );

  const assignableDentists = dentists.filter(
    (dentist) => dentist.is_active !== false && dentist.user_is_active !== false,
  );

  const activeServices = services.filter(
    (service) => service.is_active !== false,
  );

  const formatDate = (date) => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => (time ? time.slice(0, 5) : "");
  const isScheduleLocked = ["Completed", "Cancelled"].includes(
    selectedAppointment?.status,
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2>Danh sách lịch hẹn</h2>
          <p>Xác nhận lịch, phân công nha sĩ và gửi thông báo cho khách.</p>
        </div>

        <div className="admin-page-header-actions">
          <button
            type="button"
            className="admin-primary-button"
            onClick={openCreateForm}
          >
            Tạo lịch mới
          </button>

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
      </div>

      {successMessage && (
        <p className="admin-success-message">{successMessage}</p>
      )}

      {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {loading && <p>Đang tải danh sách lịch hẹn...</p>}

      {!loading && filteredAppointments.length === 0 && (
        <p>Không có lịch hẹn phù hợp.</p>
      )}

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

            {errorMessage && (
              <p className="admin-error-message admin-modal-message">
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <div className="admin-form-row admin-appointment-schedule-row">
                <label>
                  Ngày khám
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    min={getTodayText()}
                    onChange={handleChange}
                    disabled={isScheduleLocked}
                    required
                  />
                </label>

                <label>
                  Giờ khám
                  <input
                    type="time"
                    name="appointment_time"
                    value={formData.appointment_time}
                    step="1800"
                    onChange={handleChange}
                    disabled={isScheduleLocked}
                    required
                  />
                </label>
              </div>

              <p className="admin-form-hint admin-appointment-schedule-hint">
                Khung giờ làm việc: 08:00-12:00 và 13:30-18:00, mỗi lịch cách nhau 30 phút.
              </p>

              <label>
                Phân công nha sĩ
                <select
                  name="dentist_id"
                  value={formData.dentist_id}
                  onChange={handleChange}
                >
                  <option value="">Chưa phân công</option>

                  {assignableDentists.map((dentist) => (
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
                  placeholder="Ví dụ: Bác sĩ khách chọn đang bận, phòng khám đã phân công bác sĩ khác thay thế."
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

      {isCreateOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <div>
                <h3>Tạo lịch hẹn</h3>
                <p>
                  Điền thông tin lịch hẹn, kiểm tra nha sĩ và khung giờ trước
                  khi lưu.
                </p>
              </div>

              <button type="button" onClick={closeCreateForm}>
                ×
              </button>
            </div>

            {errorMessage && (
              <p className="admin-error-message admin-modal-message">
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleCreateSubmit}>
              <label>
                Khách hàng
                <select
                  name="patient_id"
                  value={createFormData.patient_id}
                  onChange={handleCreateChange}
                  required
                >
                  <option value="">Chọn khách hàng</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - {patient.phone}
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-form-row admin-appointment-schedule-row">
                <label>
                  Ngày khám
                  <input
                    type="date"
                    name="appointment_date"
                    value={createFormData.appointment_date}
                    min={getTodayText()}
                    onChange={handleCreateChange}
                    required
                  />
                </label>

                <label>
                  Giờ khám
                  <input
                    type="time"
                    name="appointment_time"
                    value={createFormData.appointment_time}
                    step="1800"
                    onChange={handleCreateChange}
                    required
                  />
                </label>
              </div>

              <div className="admin-form-row">
                <label>
                  Dịch vụ
                  <select
                    name="service_id"
                    value={createFormData.service_id}
                    onChange={handleCreateChange}
                    required
                  >
                    <option value="">Chọn dịch vụ</option>
                    {activeServices.map((service) => (
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
                    value={createFormData.dentist_id}
                    onChange={handleCreateChange}
                  >
                    <option value="">Để phòng khám sắp xếp</option>
                    {assignableDentists.map((dentist) => (
                      <option key={dentist.id} value={dentist.id}>
                        {dentist.full_name} - {dentist.specialty}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Trạng thái
                <select
                  name="status"
                  value={createFormData.status}
                  onChange={handleCreateChange}
                >
                  <option value="Pending">Chờ xác nhận</option>
                  <option value="Confirmed">Xác nhận lịch</option>
                </select>
              </label>

              <label>
                Ghi chú
                <textarea
                  name="note"
                  rows="4"
                  value={createFormData.note}
                  onChange={handleCreateChange}
                  placeholder="Ví dụ: Tái khám theo bệnh án #12"
                />
              </label>

              <div className="admin-modal-actions">
                <button type="button" onClick={closeCreateForm}>
                  Đóng
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : "Lưu lịch hẹn"}
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
