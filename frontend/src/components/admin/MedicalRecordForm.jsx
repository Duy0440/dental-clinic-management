import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const getTodayText = () => new Date().toISOString().slice(0, 10);

// form benh an cho le tan/admin, nha si se xac nhan sau
function MedicalRecordForm({ customerId, appointments, dentists, onClose, onCreated }) {
  const suggestedAppointment = appointments.find((item) => ["Confirmed", "Completed"].includes(item.status));
  const [formData, setFormData] = useState({
    appointment_id: suggestedAppointment?.id || "",
    dentist_id: suggestedAppointment?.dentist_id || "",
    chief_complaint: "",
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
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "dentist_id" || name === "re_examination_date" ? { re_examination_time: "" } : {}),
    }));
  };

  useEffect(() => {
    const loadTimes = async () => {
      if (!formData.dentist_id || !formData.re_examination_date) {
        setAvailableTimes([]);
        return;
      }
      try {
        const response = await axiosClient.get("/appointments/available-times", {
          params: { dentist_id: formData.dentist_id, date: formData.re_examination_date },
        });
        setAvailableTimes(response.data.data?.available_times || []);
      } catch (error) {
        setAvailableTimes([]);
      }
    };
    loadTimes();
  }, [formData.dentist_id, formData.re_examination_date]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!formData.dentist_id) {
      setMessage("Vui long chon nha si phu trach.");
      return;
    }
    if (formData.re_examination_date && !formData.re_examination_time) {
      setMessage("Vui long chon gio tai kham con trong.");
      return;
    }
    try {
      setSaving(true);
      const response = await axiosClient.post("/medical-records", {
        ...formData,
        patient_id: Number(customerId),
        appointment_id: formData.appointment_id ? Number(formData.appointment_id) : null,
        dentist_id: Number(formData.dentist_id),
        status: "PendingConfirmation",
      });
      if (attachmentFile) {
        const uploadData = new FormData();
        uploadData.append("file", attachmentFile);
        await axiosClient.post(`/medical-records/${response.data.data.id}/attachments`, uploadData);
      }
      await onCreated();
    } catch (error) {
      setMessage(error.response?.data?.message || "Khong the luu benh an.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal admin-medical-record-modal">
        <div className="admin-modal-header">
          <div><h3>Tao benh an dieu tri</h3><p>Thong tin nay se duoc nha si kiem tra va xac nhan truoc khi hien thi cho khach.</p></div>
          <button type="button" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <label>Lich kham lien quan<select name="appointment_id" value={formData.appointment_id} onChange={handleChange}><option value="">Khong gan lich hen</option>{appointments.map((item) => <option key={item.id} value={item.id}>#{item.id} - {item.service_name}</option>)}</select></label>
            <label>Nha si phu trach<select required name="dentist_id" value={formData.dentist_id} onChange={handleChange}><option value="">Chon nha si</option>{dentists.map((item) => <option key={item.id} value={item.id}>{item.full_name} - {item.specialty}</option>)}</select></label>
          </div>
          <label>Ly do kham<textarea name="chief_complaint" value={formData.chief_complaint} onChange={handleChange} rows="2" placeholder="Vi du: dau rang ham duoi, e buot khi an lanh..." /></label>
          <div className="admin-form-row">
            <label>Tien su benh<textarea name="medical_history" value={formData.medical_history} onChange={handleChange} rows="2" placeholder="Benh nen, thuoc dang dung neu co" /></label>
            <label>Di ung<textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2" placeholder="Di ung thuoc hoac vat lieu neu co" /></label>
          </div>
          <label>Kham lam sang<textarea name="clinical_examination" value={formData.clinical_examination} onChange={handleChange} rows="2" placeholder="Tinh trang quan sat duoc khi tham kham" /></label>
          <div className="admin-form-row">
            <label>Chan doan<textarea name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows="3" placeholder="Chan doan ban dau" /></label>
            <label>Noi dung dieu tri<textarea name="treatment" value={formData.treatment} onChange={handleChange} rows="3" placeholder="Cac buoc da thuc hien" /></label>
          </div>
          <div className="admin-form-row">
            <label>Ke hoach dieu tri<textarea name="treatment_plan" value={formData.treatment_plan} onChange={handleChange} rows="2" placeholder="Ke hoach cho lan tiep theo" /></label>
            <label>Don thuoc/huong dan<textarea name="prescription" value={formData.prescription} onChange={handleChange} rows="2" placeholder="Thuoc va huong dan cham soc neu co" /></label>
          </div>
          <label>Ghi chu chuyen mon<textarea name="note" value={formData.note} onChange={handleChange} rows="2" /></label>
          <div className="admin-form-row">
            <label>Ngay tai kham<input type="date" name="re_examination_date" min={getTodayText()} value={formData.re_examination_date} onChange={handleChange} /></label>
            <label>Gio tai kham<select name="re_examination_time" value={formData.re_examination_time} onChange={handleChange} disabled={!formData.re_examination_date}><option value="">Chon gio</option>{availableTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
          </div>
          <label>Tai lieu dinh kem<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setAttachmentFile(event.target.files[0] || null)} /></label>
          {message && <p className="admin-error-message">{message}</p>}
          <div className="admin-modal-actions"><button type="button" onClick={onClose}>Dong</button><button type="submit" disabled={saving}>{saving ? "Dang luu..." : "Luu va gui nha si xac nhan"}</button></div>
        </form>
      </div>
    </div>
  );
}

export default MedicalRecordForm;
