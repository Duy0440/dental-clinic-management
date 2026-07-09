import { useState } from "react";
import axiosClient from "../../api/axiosClient";

function MedicalRecordForm({
  customerId,
  appointments,
  dentists,
  onClose,
  onCreated,
}) {
  const suggestedAppointment = appointments.find((appointment) =>
    ["Confirmed", "Completed"].includes(appointment.status),
  );

  const [formData, setFormData] = useState({
    appointment_id: suggestedAppointment?.id || "",
    dentist_id: suggestedAppointment?.dentist_id || "",
    diagnosis: "",
    treatment: "",
    note: "",
    re_examination_date: "",
    re_examination_time: "",
  });

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFileChange = (event) => {
    setAttachmentFile(event.target.files[0] || null);
  };

  const uploadAttachment = async (recordId) => {
    if (!attachmentFile) {
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", attachmentFile);

    await axiosClient.post(
      `/medical-records/${recordId}/attachments`,
      uploadData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      const response = await axiosClient.post("/medical-records", {
        patient_id: Number(customerId),
        appointment_id: formData.appointment_id
          ? Number(formData.appointment_id)
          : null,
        dentist_id: Number(formData.dentist_id),
        diagnosis: formData.diagnosis,
        treatment: formData.treatment,
        note: formData.note,
        re_examination_date: formData.re_examination_date || null,
        re_examination_time: formData.re_examination_time || null,
        attachment_url: null,
      });

      const newRecord = response.data.data;

      await uploadAttachment(newRecord.id);
      await onCreated();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          "Không thể lưu kết quả điều trị.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal">
        <div className="admin-modal-header">
          <div>
            <h3>Thêm kết quả điều trị</h3>
            <p>Lưu chẩn đoán, hướng điều trị và file hình ảnh nếu có.</p>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Lịch khám liên quan
            <select
              name="appointment_id"
              value={formData.appointment_id}
              onChange={handleChange}
            >
              <option value="">Không gắn với lịch hẹn</option>

              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  #{appointment.id} - {appointment.service_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nha sĩ chịu trách nhiệm
            <select
              required
              name="dentist_id"
              value={formData.dentist_id}
              onChange={handleChange}
            >
              <option value="">Chọn nha sĩ</option>

              {dentists.map((dentist) => (
                <option key={dentist.id} value={dentist.id}>
                  {dentist.full_name} - {dentist.specialty}
                </option>
              ))}
            </select>
          </label>

          <label>
            Chẩn đoán
            <textarea
              required
              rows="3"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              placeholder="Ví dụ: sâu răng hàm dưới, viêm nướu nhẹ..."
            />
          </label>

          <label>
            Nội dung điều trị
            <textarea
              required
              rows="3"
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
              placeholder="Ví dụ: vệ sinh răng, trám răng, kê thuốc..."
            />
          </label>

          <label>
            Ghi chú chuyên môn
            <textarea
              rows="3"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Ghi chú thêm cho lần tái khám hoặc theo dõi."
            />
          </label>

          <div className="admin-form-row">
            <label>
              Ngày tái khám đề xuất
              <input
                type="date"
                name="re_examination_date"
                value={formData.re_examination_date}
                onChange={handleChange}
              />
            </label>

            <label>
              Giờ tái khám đề xuất
              <input
                type="time"
                name="re_examination_time"
                value={formData.re_examination_time}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Hình ảnh hoặc file đính kèm
            <input
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              onChange={handleFileChange}
            />
          </label>

          <p className="admin-form-hint">
            Có thể đính kèm ảnh răng, phim chụp hoặc file PDF kết quả.
          </p>

          {errorMessage && (
            <p className="admin-error-message">{errorMessage}</p>
          )}

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose}>
              Đóng
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu kết quả"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalRecordForm;