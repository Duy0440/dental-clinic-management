// admin va nha si nhap benh an
import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { extractMedicalRecordTeeth } from "../../utils/dentalChart";
import DentalChart from "../DentalChart";
import MedicalRecordStatusBadge from "../MedicalRecordStatusBadge";

const getTodayText = () => new Date().toISOString().slice(0, 10);

const toFormDate = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const toFormTime = (value) => {
  if (!value) return "";
  return String(value).slice(0, 5);
};

const buildDefaultForm = (appointment) => ({
  appointment_id: appointment?.id || "",
  dentist_id: appointment?.dentist_id || "",
  chief_complaint: appointment?.note || "",
  medical_history: "",
  allergies: "",
  clinical_examination: "",
  diagnosis: "",
  treatment: "",
  treatment_plan: "",
  prescription: "",
  note: "",
  re_examination_date: "",
  re_examination_time: "",
});

const buildFormFromRecord = (record, appointment) => {
  if (!record) {
    return buildDefaultForm(appointment);
  }

  return {
    appointment_id: record.appointment_id || "",
    dentist_id: record.dentist_id || "",
    chief_complaint: record.chief_complaint || "",
    medical_history: record.medical_history || "",
    allergies: record.allergies || "",
    clinical_examination: record.clinical_examination || "",
    diagnosis: record.diagnosis || "",
    treatment: record.treatment || "",
    treatment_plan: record.treatment_plan || "",
    prescription: record.prescription || "",
    note: record.note || "",
    re_examination_date: toFormDate(record.re_examination_date),
    re_examination_time: toFormTime(record.re_examination_time),
  };
};

function MedicalRecordForm({
  customerId,
  appointments = [],
  dentists = [],
  record = null,
  mode = "create",
  onClose,
  onCreated,
  onSaved,
}) {
  const isEditMode = mode === "edit" && record?.id;
  const suggestedAppointment = useMemo(
    () =>
      appointments.find((item) =>
        ["Confirmed", "Completed"].includes(item.status),
      ),
    [appointments],
  );

  const [formData, setFormData] = useState(() =>
    buildFormFromRecord(record, suggestedAppointment),
  );
  const [teeth, setTeeth] = useState(() => extractMedicalRecordTeeth(record));
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFormData(buildFormFromRecord(record, suggestedAppointment));
    setTeeth(extractMedicalRecordTeeth(record));
    setAttachmentFile(null);
    setMessage("");
  }, [record, suggestedAppointment]);

  useEffect(() => {
    let cancelled = false;

    const loadTimes = async () => {
      if (!formData.dentist_id || !formData.re_examination_date) {
        setAvailableTimes([]);
        return;
      }

      try {
        const response = await axiosClient.get(
          "/appointments/available-times",
          {
            params: {
              dentist_id: formData.dentist_id,
              date: formData.re_examination_date,
            },
          },
        );

        if (!cancelled) {
          const nextTimes = response.data?.data?.available_times || [];
          const currentTime = formData.re_examination_time;
          setAvailableTimes(
            currentTime && !nextTimes.includes(currentTime)
              ? [currentTime, ...nextTimes]
              : nextTimes,
          );
        }
      } catch {
        if (!cancelled) {
          setAvailableTimes(
            formData.re_examination_time ? [formData.re_examination_time] : [],
          );
        }
      }
    };

    loadTimes();

    return () => {
      cancelled = true;
    };
  }, [
    formData.dentist_id,
    formData.re_examination_date,
    formData.re_examination_time,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "appointment_id") {
      const selectedAppointment = appointments.find(
        (item) => String(item.id) === String(value),
      );

      setFormData((current) => ({
        ...current,
        appointment_id: value,
        dentist_id: selectedAppointment?.dentist_id || current.dentist_id || "",
        chief_complaint:
          current.chief_complaint || selectedAppointment?.note || "",
        re_examination_time: "",
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "dentist_id" || name === "re_examination_date"
        ? { re_examination_time: "" }
        : {}),
    }));
  };

  const validateForm = () => {
    const patientId = record?.patient_id || customerId;

    if (!patientId) {
      return "Không xác định được bệnh nhân.";
    }

    if (!formData.dentist_id) {
      return "Vui lòng chọn nha sĩ phụ trách.";
    }

    if (!formData.diagnosis.trim()) {
      return "Vui lòng nhập chẩn đoán.";
    }

    if (!formData.treatment.trim() && !formData.treatment_plan.trim()) {
      return "Vui lòng nhập nội dung điều trị hoặc hướng điều trị.";
    }

    if (formData.re_examination_date && !formData.re_examination_time) {
      return "Vui lòng chọn giờ tái khám còn trống.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);

      const patientId = record?.patient_id || customerId;
      const payload = {
        ...formData,
        patient_id: Number(patientId),
        appointment_id: formData.appointment_id
          ? Number(formData.appointment_id)
          : null,
        dentist_id: Number(formData.dentist_id),
        teeth,
        status: "PendingConfirmation",
      };

      const response = isEditMode
        ? await axiosClient.put(`/medical-records/${record.id}`, payload)
        : await axiosClient.post("/medical-records", payload);

      const savedRecord = response.data?.data;
      const medicalRecordId = savedRecord?.id;

      if (!medicalRecordId) {
        throw new Error("Không nhận được mã bệnh án sau khi lưu.");
      }

      if (attachmentFile) {
        const uploadData = new FormData();
        uploadData.append("file", attachmentFile);

        await axiosClient.post(
          `/medical-records/${medicalRecordId}/attachments`,
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }

      const callback = onSaved || onCreated;
      if (typeof callback === "function") {
        await callback(savedRecord);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Không thể lưu bệnh án.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay admin-medical-record-overlay" role="presentation">
      <div
        className="admin-modal admin-medical-record-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="medical-record-form-title"
      >
        <div className="admin-modal-header">
          <div>
            <h3 id="medical-record-form-title">
              {isEditMode ? "Chỉnh sửa bệnh án" : "Tạo bệnh án điều trị"}
            </h3>
            <p>
              {isEditMode
                ? "Cập nhật nội dung bệnh án trước khi nha sĩ xác nhận."
                : "Admin/lễ tân nhập thông tin theo phiếu bệnh án. Nha sĩ phụ trách sẽ kiểm tra và xác nhận trước khi hiển thị cho khách hàng."}
            </p>
            {record?.status && <MedicalRecordStatusBadge status={record.status} />}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng phiếu bệnh án"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form className="medical-record-form" onSubmit={handleSubmit}>
          <section className="medical-record-section">
            <div className="medical-record-section-heading">
              <h4>Thông tin lần khám</h4>
              <p>
                Chọn lịch khám liên quan và nha sĩ chịu trách nhiệm chuyên môn.
              </p>
            </div>

            <div className="admin-form-row">
              <label>
                Lịch khám liên quan
                <select
                  name="appointment_id"
                  value={formData.appointment_id}
                  onChange={handleChange}
                  disabled={saving || isEditMode}
                >
                  <option value="">Không gắn với lịch hẹn</option>
                  {appointments.map((item) => (
                    <option key={item.id} value={item.id}>
                      #{item.id} - {item.service_name || "Chưa xác định dịch vụ"}
                    </option>
                  ))}
                  {isEditMode &&
                    formData.appointment_id &&
                    !appointments.some(
                      (item) =>
                        String(item.id) === String(formData.appointment_id),
                    ) && (
                      <option value={formData.appointment_id}>
                        Lịch #{formData.appointment_id}
                      </option>
                    )}
                </select>
              </label>

              <label>
                Nha sĩ phụ trách <span aria-hidden="true">*</span>
                <select
                  required
                  name="dentist_id"
                  value={formData.dentist_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">Chọn nha sĩ</option>
                  {dentists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                      {item.specialty ? ` - ${item.specialty}` : ""}
                    </option>
                  ))}
                  {formData.dentist_id &&
                    !dentists.some(
                      (item) => String(item.id) === String(formData.dentist_id),
                    ) && (
                      <option value={formData.dentist_id}>
                        {record?.dentist_name || `Nha sĩ #${formData.dentist_id}`}
                      </option>
                    )}
                </select>
              </label>
            </div>
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-heading">
              <h4>Thông tin bệnh án</h4>
              <p>Nhập đầy đủ các trường lâm sàng của phiếu bệnh án.</p>
            </div>

            <label>
              Lý do khám
              <textarea
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                rows={2}
                placeholder="Ví dụ: Đau răng hàm dưới, ê buốt khi ăn lạnh..."
                disabled={saving}
              />
            </label>

            <div className="admin-form-row">
              <label>
                Tiền sử bệnh
                <textarea
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Bệnh nền, tiền sử điều trị, thuốc đang sử dụng..."
                  disabled={saving}
                />
              </label>

              <label>
                Dị ứng
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Dị ứng thuốc, vật liệu hoặc thực phẩm nếu có..."
                  disabled={saving}
                />
              </label>
            </div>

            <label>
              Khám lâm sàng
              <textarea
                name="clinical_examination"
                value={formData.clinical_examination}
                onChange={handleChange}
                rows={4}
                placeholder="Mô tả tình trạng quan sát được trong quá trình thăm khám..."
                disabled={saving}
              />
            </label>

            <div className="admin-form-row">
              <label>
                Chẩn đoán <span aria-hidden="true">*</span>
                <textarea
                  required
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Nhập chẩn đoán của nha sĩ..."
                  disabled={saving}
                />
              </label>

              <label>
                Điều trị
                <textarea
                  name="treatment"
                  value={formData.treatment}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Các bước hoặc thủ thuật đã thực hiện..."
                  disabled={saving}
                />
              </label>
            </div>

            <div className="admin-form-row">
              <label>
                Hướng điều trị
                <textarea
                  name="treatment_plan"
                  value={formData.treatment_plan}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Hướng xử lý hoặc nội dung cho lần khám sau..."
                  disabled={saving}
                />
              </label>

              <label>
                Đơn thuốc/Hướng dẫn
                <textarea
                  name="prescription"
                  value={formData.prescription}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Thuốc, liều dùng và hướng dẫn chăm sóc..."
                  disabled={saving}
                />
              </label>
            </div>

            <label>
              Ghi chú
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                placeholder="Ghi chú nội bộ dành cho nha sĩ hoặc lần tái khám..."
                disabled={saving}
              />
            </label>
          </section>

          <section className="medical-record-section">
            <DentalChart mode="edit" teeth={teeth} onChange={setTeeth} />
          </section>

          <section className="medical-record-section">
            <div className="medical-record-section-heading">
              <h4>Tái khám và tài liệu</h4>
              <p>Có thể để trống nếu chưa xác định lịch tiếp theo.</p>
            </div>

            <div className="admin-form-row">
              <label>
                Ngày tái khám
                <input
                  type="date"
                  name="re_examination_date"
                  min={isEditMode ? undefined : getTodayText()}
                  value={formData.re_examination_date}
                  onChange={handleChange}
                  disabled={saving}
                />
              </label>

              <label>
                Giờ tái khám
                <select
                  name="re_examination_time"
                  value={formData.re_examination_time}
                  onChange={handleChange}
                  disabled={
                    saving ||
                    !formData.re_examination_date ||
                    !formData.dentist_id
                  }
                >
                  <option value="">Chọn giờ</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {isEditMode && record?.attachments?.length > 0 && (
              <div className="medical-record-existing-files">
                <strong>File đã đính kèm</strong>
                {record.attachments.map((file) => (
                  <span key={file.id}>{file.file_name}</span>
                ))}
              </div>
            )}

            <label>
              {isEditMode ? "Đính kèm thêm file mới" : "File đính kèm"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) =>
                  setAttachmentFile(event.target.files?.[0] || null)
                }
                disabled={saving}
              />
              <small>Hỗ trợ JPG, JPEG, PNG, WEBP hoặc PDF.</small>
            </label>
          </section>

          {message && (
            <p className="admin-error-message" role="alert">
              {message}
            </p>
          )}

          <div className="admin-modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>
              Đóng
            </button>

            <button type="submit" disabled={saving}>
              {saving
                ? "Đang lưu bệnh án..."
                : isEditMode
                  ? "Lưu cập nhật"
                  : "Lưu và gửi nha sĩ xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MedicalRecordForm;
