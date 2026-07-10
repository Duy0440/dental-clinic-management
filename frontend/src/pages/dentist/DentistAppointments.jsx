import { useEffect, useState } from "react";
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

const getTodayText = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function DentistAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    diagnosis: "",
    treatment: "",
    note: "",
    re_examination_date: "",
    re_examination_time: "",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableReExamTimes, setAvailableReExamTimes] = useState([]);
  const [loadingReExamTimes, setLoadingReExamTimes] = useState(false);
  const [reExamTimeMessage, setReExamTimeMessage] = useState(
    "Chọn ngày tái khám để kiểm tra giờ còn trống.",
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/appointments/dentist/my-schedule");
      setAppointments(response.data.data || []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể tải lịch khám của nha sĩ.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const today = getTodayText();
  const todayAppointments = appointments.filter(
    (appointment) => appointment.appointment_date === today,
  );
  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === "Pending",
  );
  const confirmedAppointments = appointments.filter(
    (appointment) => appointment.status === "Confirmed",
  );
  const needRecordAppointments = appointments.filter(
    (appointment) => appointment.status === "Confirmed" && !appointment.has_medical_record,
  );
  const normalizedSearch = searchText.trim().toLowerCase();
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      !normalizedSearch ||
      [
        appointment.patient_name,
        appointment.patient_phone,
        appointment.service_name,
        appointment.note,
        appointment.clinic_note,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "today" && appointment.appointment_date === today) ||
      (statusFilter === "confirmed" && appointment.status === "Confirmed") ||
      (statusFilter === "pending" && appointment.status === "Pending") ||
      (statusFilter === "need-record" &&
        appointment.status === "Confirmed" &&
        !appointment.has_medical_record);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    if (!date) return "Chưa cập nhật";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time) => {
    if (!time) return "Chưa cập nhật";
    return time.slice(0, 5);
  };

  const openMedicalRecordForm = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      diagnosis: "",
      treatment: "",
      note: "",
      re_examination_date: "",
      re_examination_time: "",
    });
    setAttachmentFile(null);
    setMessage("");
    setErrorMessage("");
  };

  const closeMedicalRecordForm = () => {
    setSelectedAppointment(null);
    setAttachmentFile(null);
    setAvailableReExamTimes([]);
    setReExamTimeMessage("Chọn ngày tái khám để kiểm tra giờ còn trống.");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      if (name === "re_examination_date") {
        return {
          ...current,
          [name]: value,
          re_examination_time: "",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  useEffect(() => {
    const fetchReExaminationTimes = async () => {
      if (!selectedAppointment) {
        return;
      }

      if (!formData.re_examination_date) {
        setAvailableReExamTimes([]);
        setReExamTimeMessage("Chọn ngày tái khám để kiểm tra giờ còn trống.");
        return;
      }

      setLoadingReExamTimes(true);

      try {
        const params = new URLSearchParams({
          date: formData.re_examination_date,
        });

        if (selectedAppointment.dentist_id) {
          params.append("dentist_id", selectedAppointment.dentist_id);
        }

        const response = await axiosClient.get(
          `/appointments/available-times?${params.toString()}`,
        );
        const times = response.data.data?.available_times || [];
        const apiMessage = response.data.data?.message;

        setAvailableReExamTimes(times);
        setReExamTimeMessage(
          apiMessage ||
            (times.length
              ? `Còn ${times.length} khung giờ có thể đề xuất tái khám.`
              : "Ngày này đã hết giờ phù hợp, vui lòng chọn ngày khác."),
        );
        setFormData((current) =>
          current.re_examination_time && !times.includes(current.re_examination_time)
            ? { ...current, re_examination_time: "" }
            : current,
        );
      } catch (error) {
        setAvailableReExamTimes([]);
        setReExamTimeMessage(
          error.response?.data?.message ||
            "Không thể kiểm tra giờ tái khám, vui lòng thử lại.",
        );
        setFormData((current) =>
          current.re_examination_time
            ? { ...current, re_examination_time: "" }
            : current,
        );
      } finally {
        setLoadingReExamTimes(false);
      }
    };

    fetchReExaminationTimes();
  }, [selectedAppointment, formData.re_examination_date]);

  const handleCreateMedicalRecord = async (event) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!formData.diagnosis || !formData.treatment) {
      setErrorMessage("Vui lòng nhập chẩn đoán và nội dung điều trị.");
      return;
    }

    if (
      formData.re_examination_date &&
      !availableReExamTimes.includes(formData.re_examination_time)
    ) {
      setErrorMessage(
        availableReExamTimes.length
          ? "Giờ tái khám này không còn trống. Vui lòng chọn một giờ còn trống."
          : "Ngày tái khám này đã hết giờ phù hợp. Vui lòng chọn ngày khác.",
      );
      return;
    }

    try {
      setSaving(true);
      const response = await axiosClient.post("/medical-records", {
        appointment_id: selectedAppointment.id,
        patient_id: selectedAppointment.patient_id,
        dentist_id: selectedAppointment.dentist_id,
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        note: formData.note,
        re_examination_date: formData.re_examination_date || null,
        re_examination_time: formData.re_examination_time || null,
      });

      const newRecord = response.data.data;

      if (attachmentFile) {
        const uploadData = new FormData();
        uploadData.append("file", attachmentFile);

        await axiosClient.post(
          `/medical-records/${newRecord.id}/attachments`,
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      setMessage("Đã cập nhật hồ sơ điều trị thành công.");
      closeMedicalRecordForm();
      await fetchAppointments();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Không thể cập nhật hồ sơ điều trị.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dentist-page dentist-appointments-page">
      <div className="dentist-page-header">
        <div>
          <span className="dentist-eyebrow">Lịch làm việc</span>
          <h2>Lịch khám của tôi</h2>
          <p>Theo dõi các lịch hẹn đã được lễ tân phân công và cập nhật điều trị sau khi khám.</p>
        </div>
      </div>

      <div className="dentist-stat-grid four-columns">
        <div className="dentist-stat-card">
          <span>Lịch hôm nay</span>
          <strong>{todayAppointments.length}</strong>
          <p>Cần theo dõi trong ngày</p>
        </div>

        <div className="dentist-stat-card">
          <span>Chờ xác nhận</span>
          <strong>{pendingAppointments.length}</strong>
          <p>Lễ tân đang xử lý</p>
        </div>

        <div className="dentist-stat-card">
          <span>Đã xác nhận</span>
          <strong>{confirmedAppointments.length}</strong>
          <p>Có thể thăm khám</p>
        </div>

        <div className="dentist-stat-card highlight">
          <span>Cần cập nhật hồ sơ</span>
          <strong>{needRecordAppointments.length}</strong>
          <p>Sau khi khám xong</p>
        </div>
      </div>

      {message && <p className="admin-success-message">{message}</p>}
      {loading && <p className="dentist-muted-text">Đang tải lịch khám...</p>}
      {!loading && errorMessage && <p className="admin-error-message">{errorMessage}</p>}

      {!loading && !errorMessage && appointments.length > 0 && (
        <div className="dentist-filter-bar">
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm tên khách, số điện thoại, dịch vụ hoặc ghi chú..."
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Tất cả lịch</option>
            <option value="today">Lịch hôm nay</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="pending">Chờ lễ tân xác nhận</option>
            <option value="need-record">Cần cập nhật hồ sơ</option>
          </select>
        </div>
      )}

      {!loading && !errorMessage && appointments.length === 0 && (
        <div className="dentist-empty-state">
          <strong>Chưa có lịch khám được phân công</strong>
          <p>Khi lễ tân xác nhận và phân công lịch, danh sách sẽ hiển thị tại đây.</p>
        </div>
      )}

      {!loading && !errorMessage && appointments.length > 0 && filteredAppointments.length === 0 && (
        <div className="dentist-empty-state">
          <strong>Không có lịch phù hợp</strong>
          <p>Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
        </div>
      )}

      {!loading && !errorMessage && filteredAppointments.length > 0 && (
        <div className="dentist-table-card">
          <div className="dentist-table-wrapper">
            <table className="dentist-table">
              <thead>
                <tr>
                  <th>Mã lịch</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Ngày giờ</th>
                  <th>Ghi chú</th>
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
                      <strong>{formatDate(appointment.appointment_date)}</strong>
                      <span>{formatTime(appointment.appointment_time)}</span>
                    </td>

                    <td>
                      <div>{appointment.note || "Không có ghi chú từ khách."}</div>
                      {appointment.clinic_note && (
                        <span className="dentist-clinic-note">Phòng khám: {appointment.clinic_note}</span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`dentist-status ${STATUS_CLASSES[appointment.status] || "pending"}`}
                      >
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </span>
                    </td>

                    <td>
                      {appointment.has_medical_record ? (
                        <span className="dentist-status completed">Đã cập nhật hồ sơ</span>
                      ) : appointment.status !== "Confirmed" ? (
                        <span className="dentist-muted-text">Chờ lễ tân xác nhận</span>
                      ) : (
                        <button
                          type="button"
                          className="dentist-small-button"
                          onClick={() => openMedicalRecordForm(appointment)}
                        >
                          Cập nhật điều trị
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div className="dentist-modal-backdrop">
          <form className="dentist-modal" onSubmit={handleCreateMedicalRecord}>
            <div className="dentist-modal-header">
              <div>
                <span className="dentist-eyebrow">Hồ sơ điều trị</span>
                <h3>Cập nhật kết quả khám</h3>
                <p>
                  Khách hàng: <strong>{selectedAppointment.patient_name}</strong>
                </p>
              </div>
              <button type="button" onClick={closeMedicalRecordForm}>
                ×
              </button>
            </div>

            <label>Chẩn đoán</label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              rows="3"
              placeholder="Ví dụ: sâu răng hàm dưới, viêm nướu nhẹ..."
            />

            <label>Nội dung điều trị</label>
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              rows="3"
              placeholder="Ví dụ: vệ sinh răng, trám răng, kê thuốc..."
            />

            <label>Ghi chú chuyên môn</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              placeholder="Ghi chú thêm nếu có..."
            />

            <div className="dentist-form-grid">
              <div>
                <label>Ngày tái khám đề xuất</label>
                <input
                  type="date"
                  name="re_examination_date"
                  value={formData.re_examination_date}
                  min={today}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Giờ tái khám đề xuất</label>
                <select
                  name="re_examination_time"
                  value={formData.re_examination_time}
                  onChange={handleChange}
                  disabled={
                    !formData.re_examination_date ||
                    loadingReExamTimes ||
                    availableReExamTimes.length === 0
                  }
                >
                  <option value="">
                    {loadingReExamTimes
                      ? "Đang kiểm tra giờ trống..."
                      : "Chọn giờ tái khám"}
                  </option>
                  {availableReExamTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="booking-time-panel dentist-reexam-time-panel">
              <div className="booking-time-panel-header">
                <strong>Giờ tái khám còn trống</strong>
                <span>Theo lịch của bác sĩ phụ trách</span>
              </div>
              <p
                className={`booking-time-message ${
                  availableReExamTimes.length ? "is-ok" : "is-warning"
                }`}
              >
                {reExamTimeMessage}
              </p>
              {availableReExamTimes.length > 0 && (
                <div className="booking-time-grid">
                  {availableReExamTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`booking-time-chip ${
                        formData.re_examination_time === time ? "active" : ""
                      }`}
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          re_examination_time: time,
                        }))
                      }
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label>Hình ảnh hoặc file đính kèm</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => setAttachmentFile(event.target.files[0])}
            />
            <p className="dentist-helper-text">Có thể đính kèm ảnh răng, phim chụp hoặc file PDF kết quả.</p>

            {errorMessage && <p className="admin-error-message">{errorMessage}</p>}

            <button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu hồ sơ điều trị"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default DentistAppointments;
