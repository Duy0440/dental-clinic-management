const {
  withMedicalRecordTransaction,
  RECORD_STATUSES,
  getMedicalRecords,
  getMedicalRecordCounts,
  getMedicalRecordById,
  getMedicalRecordsByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
  updateMedicalRecordStatus,
  checkMedicalRecordReferences,
  findMedicalRecordByAppointmentId,
  checkReExaminationConflict,
  completeAppointment,
  assignAppointmentDentist,
} = require("../models/medicalRecordModel");
const {
  validateDentalChart,
  replaceDentalChart,
  getLatestPatientDentalChart,
} = require("../models/dentalChartModel");
const {
  createMedicalRecordAuditLog,
  getMedicalRecordAuditLogs,
} = require("../models/medicalRecordAuditModel");
const { createMedicalRecordAttachment } = require("../models/medicalRecordAttachmentModel");
const { findPatientByUserId } = require("../models/patientModel");
const { findDentistByUserId } = require("../models/dentistModel");
const { checkDentistAppointmentConflict } = require("../models/appointmentModel");
const { checkDentistUnavailableConflict } = require("../models/dentistUnavailableModel");
const {
  getClinicDayInfo,
  isClinicBookingTime,
  isPastClinicDate,
  isPastClinicDateTime,
  normalizeTime,
} = require("../utils/clinicSchedule");

const EDITABLE_STATUSES = new Set(["PendingConfirmation"]);
const ALLOWED_LIST_STATUSES = new Set(RECORD_STATUSES);

// input number (doi id sang so de tranh loi query)
const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// text value (doi chuoi rong thanh null)
const cleanText = (value) => {
  if (typeof value !== "string") return value ?? null;
  return value.trim() || null;
};

const getTeethPayload = (body = {}) => {
  if (Array.isArray(body.teeth)) {
    return body.teeth;
  }

  if (Array.isArray(body.dental_chart)) {
    return body.dental_chart;
  }

  return [];
};

const recordDataFromBody = (body, dentistId) => ({
  appointment_id: parseId(body.appointment_id),
  patient_id: parseId(body.patient_id),
  dentist_id: dentistId,
  chief_complaint: cleanText(body.chief_complaint),
  medical_history: cleanText(body.medical_history),
  allergies: cleanText(body.allergies),
  clinical_examination: cleanText(body.clinical_examination),
  diagnosis: cleanText(body.diagnosis),
  treatment: cleanText(body.treatment),
  treatment_plan: cleanText(body.treatment_plan),
  prescription: cleanText(body.prescription),
  note: cleanText(body.note),
  re_examination_date: cleanText(body.re_examination_date),
  re_examination_time: normalizeTime(body.re_examination_time),
  attachment_url: cleanText(body.attachment_url),
});

// confirm check (khong cho xac nhan ho so chua co ket luan)
const hasConfirmationContent = (data) =>
  Boolean(data.diagnosis && (data.treatment || data.treatment_plan));

const getDentistProfile = async (userId) => findDentistByUserId(userId);

// record scope (kiem tra quyen tren tung ho so)
const canAccessRecord = async (req, record) => {
  if (req.user.role === "admin") return true;
  if (req.user.role === "dentist") {
    const dentist = await getDentistProfile(req.user.id);
    return dentist && Number(record.dentist_id) === Number(dentist.id);
  }
  if (req.user.role === "customer") {
    const patient = await findPatientByUserId(req.user.id);
    return patient && record.status === "Confirmed" && Number(record.patient_id) === Number(patient.id);
  }
  return false;
};

// validate record refs (kiem tra khach, nha si va lich hen)
const validateRecordReferences = async (data, db) => {
  if (!data.patient_id || !data.dentist_id) return { message: "Patient and dentist are required" };

  const refs = await checkMedicalRecordReferences(data.patient_id, data.dentist_id, data.appointment_id, db);
  if (!refs.patient) return { message: "Patient not found" };
  if (!refs.dentist || !refs.dentist.is_active || !refs.dentist.user_is_active) {
    return { message: "Dentist is not available" };
  }
  if (data.appointment_id) {
    if (!refs.appointment) return { message: "Appointment not found" };
    if (Number(refs.appointment.patient_id) !== Number(data.patient_id)) {
      return { message: "Appointment does not belong to this patient" };
    }
    if (refs.appointment.dentist_id && Number(refs.appointment.dentist_id) !== Number(data.dentist_id)) {
      return { message: "Appointment belongs to another dentist" };
    }
  }
  return { refs };
};

// validate reexam (kiem tra ngay gio tai kham)
const validateReExamination = async (data, recordId) => {
  if (Boolean(data.re_examination_date) !== Boolean(data.re_examination_time)) {
    return { message: "Please provide both re-examination date and time" };
  }
  if (!data.re_examination_date) return {};
  if (isPastClinicDate(data.re_examination_date)) return { message: "Re-examination date cannot be in the past" };
  if (isPastClinicDateTime(data.re_examination_date, data.re_examination_time)) {
    return { message: "Re-examination time cannot be in the past" };
  }
  if (!isClinicBookingTime(data.re_examination_date, data.re_examination_time)) {
    const day = getClinicDayInfo(data.re_examination_date);
    return { message: day.isClosed ? day.message : "Re-examination time must be within clinic booking hours" };
  }

  const [recordConflict, appointmentConflict, unavailableConflict] = await Promise.all([
    checkReExaminationConflict(data.dentist_id, data.re_examination_date, data.re_examination_time, recordId),
    checkDentistAppointmentConflict(data.dentist_id, data.re_examination_date, data.re_examination_time),
    checkDentistUnavailableConflict(data.dentist_id, data.re_examination_date, data.re_examination_time),
  ]);
  return recordConflict || appointmentConflict || unavailableConflict
    ? { message: "Re-examination time conflicts with dentist schedule" }
    : {};
};

// record list (admin xem tat ca, nha si xem ho so cua minh)
const listMedicalRecords = async (req, res) => {
  try {
    const requestedStatus = req.query.status;
    if (requestedStatus && !ALLOWED_LIST_STATUSES.has(requestedStatus)) {
      return res.json({
        data: [],
        records: [],
        counts: {
          PendingConfirmation: 0,
          Confirmed: 0,
        },
      });
    }

    const filters = {
      patientId: parseId(req.query.patient_id),
      appointmentId: parseId(req.query.appointment_id),
      status: requestedStatus,
      search: req.query.search,
    };

    if (req.user.role === "dentist") {
      const dentist = await getDentistProfile(req.user.id);
      if (!dentist) return res.status(404).json({ message: "Dentist profile not found" });
      filters.dentistId = dentist.id;
    } else {
      filters.dentistId = parseId(req.query.dentist_id);
    }

    const [records, counts] = await Promise.all([
      getMedicalRecords(filters),
      getMedicalRecordCounts({ ...filters, status: undefined }),
    ]);

    return res.json({ data: records, records, counts });
  } catch (error) {
    console.error("listMedicalRecords failed:", error);
    return res.status(500).json({
      message: "Không thể tải danh sách bệnh án. Vui lòng thử lại.",
    });
  }
};

// record detail (chi tra dung ho so theo quyen)
const getMedicalRecordDetail = async (req, res) => {
  try {
    const record = await getMedicalRecordById(parseId(req.params.id));
    if (!record) return res.status(404).json({ message: "Medical record not found" });
    if (!(await canAccessRecord(req, record))) return res.status(403).json({ message: "You do not have permission" });
    return res.json({ data: record });
  } catch (error) {
    return res.status(500).json({ message: "Cannot load medical record" });
  }
};

// patient result (khach chi xem ho so da xac nhan)
const getMedicalResultsByPatientId = async (req, res) => {
  try {
    const patientId = parseId(req.params.patientId);
    if (!patientId) return res.status(400).json({ message: "Invalid patient ID" });
    if (req.user.role === "customer") {
      const patient = await findPatientByUserId(req.user.id);
      if (!patient || Number(patient.id) !== patientId) return res.status(403).json({ message: "You can only view your own results" });
      return res.json({ data: await getMedicalRecordsByPatientId(patientId, { confirmedOnly: true }) });
    }
    if (req.user.role === "dentist") {
      const dentist = await getDentistProfile(req.user.id);
      if (!dentist) return res.status(404).json({ message: "Dentist profile not found" });
      return res.json({ data: await getMedicalRecordsByPatientId(patientId, { dentistId: dentist.id }) });
    }
    return res.json({ data: await getMedicalRecordsByPatientId(patientId) });
  } catch (error) {
    return res.status(500).json({ message: "Cannot load patient records" });
  }
};

// latest chart (chi tra du lieu da xac nhan cho khach)
const getPatientDentalChart = async (req, res) => {
  try {
    const patientId = parseId(req.params.patientId);
    if (!patientId) return res.status(400).json({ message: "Invalid patient ID" });
    if (req.user.role === "customer") {
      const patient = await findPatientByUserId(req.user.id);
      if (!patient || Number(patient.id) !== patientId) return res.status(403).json({ message: "You can only view your own chart" });
    }
    return res.json({ data: await getLatestPatientDentalChart(patientId) });
  } catch (error) {
    return res.status(500).json({ message: "Cannot load dental chart" });
  }
};

// create record (tao ho so cho nha si xac nhan)
const addMedicalRecord = async (req, res) => {
  try {
    const dentist = req.user.role === "dentist" ? await getDentistProfile(req.user.id) : null;
    if (req.user.role === "dentist" && !dentist) return res.status(404).json({ message: "Dentist profile not found" });
    const data = recordDataFromBody(req.body, dentist ? dentist.id : parseId(req.body.dentist_id));
    const teeth = getTeethPayload(req.body);
    const status = "PendingConfirmation";
    const chartError = validateDentalChart(teeth);
    if (chartError) return res.status(400).json({ message: chartError });
    const validation = await validateRecordReferences(data);
    if (validation.message) return res.status(400).json({ message: validation.message });
    const reexam = await validateReExamination(data);
    if (reexam.message) return res.status(409).json({ message: reexam.message });

    const result = await withMedicalRecordTransaction(async (db) => {
      if (data.appointment_id) {
        if (await findMedicalRecordByAppointmentId(data.appointment_id, db)) throw new Error("DUPLICATE_APPOINTMENT_RECORD");
        await assignAppointmentDentist(data.appointment_id, data.dentist_id, db);
      }
      const record = await createMedicalRecord({ ...data, entered_by_user_id: req.user.id, status }, db);
      if (Array.isArray(teeth)) {
        await replaceDentalChart(record.id, teeth, db, {
          patientId: data.patient_id,
          createdByUserId: req.user.id,
        });
      }
      await createMedicalRecordAuditLog({
        medicalRecordId: record.id,
        action: "CREATED",
        changedByUserId: req.user.id,
        newData: { status, teeth },
      }, db);
      return getMedicalRecordById(record.id, db);
    });
    return res.status(201).json({ message: "Medical record created", data: result });
  } catch (error) {
    if (error.message === "DUPLICATE_APPOINTMENT_RECORD" || error.code === "23505") {
      return res.status(409).json({ message: "This appointment already has a medical record" });
    }
    return res.status(500).json({ message: "Cannot create medical record" });
  }
};

// update record (chi sua ho so cho xac nhan)
const editMedicalRecord = async (req, res) => {
  try {
    const recordId = parseId(req.params.id);
    const oldRecord = await getMedicalRecordById(recordId);
    if (!oldRecord) return res.status(404).json({ message: "Medical record not found" });
    if (!EDITABLE_STATUSES.has(oldRecord.status)) return res.status(409).json({ message: "Confirmed records cannot be edited" });
    if (!(await canAccessRecord(req, oldRecord))) return res.status(403).json({ message: "You do not have permission" });
    const dentist = req.user.role === "dentist" ? await getDentistProfile(req.user.id) : null;
    const data = recordDataFromBody({ ...oldRecord, ...req.body }, dentist ? dentist.id : parseId(req.body.dentist_id) || oldRecord.dentist_id);
    const hasTeethPayload =
      Array.isArray(req.body.teeth) || Array.isArray(req.body.dental_chart);
    const teeth = hasTeethPayload ? getTeethPayload(req.body) : oldRecord.teeth || [];
    data.appointment_id = oldRecord.appointment_id;
    data.patient_id = parseId(req.body.patient_id) || oldRecord.patient_id;
    const chartError = validateDentalChart(teeth);
    if (chartError) return res.status(400).json({ message: chartError });
    const validation = await validateRecordReferences(data);
    if (validation.message) return res.status(400).json({ message: validation.message });
    const reexam = await validateReExamination(data, recordId);
    if (reexam.message) return res.status(409).json({ message: reexam.message });

    const updated = await withMedicalRecordTransaction(async (db) => {
      await updateMedicalRecord(recordId, data, db);
      if (hasTeethPayload) {
        await replaceDentalChart(recordId, teeth, db, {
          patientId: data.patient_id,
          createdByUserId: req.user.id,
        });
      }
      await createMedicalRecordAuditLog({
        medicalRecordId: recordId,
        action: "UPDATED",
        changedByUserId: req.user.id,
        oldData: { status: oldRecord.status },
        newData: { teeth },
      }, db);
      return getMedicalRecordById(recordId, db);
    });
    return res.json({ message: "Medical record updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: "Cannot update medical record" });
  }
};

// confirm record (chi nha si phu trach duoc xac nhan va hoan tat lich)
const confirmMedicalRecord = async (req, res) => {
  try {
    const record = await getMedicalRecordById(parseId(req.params.id));
    if (!record) return res.status(404).json({ message: "Medical record not found" });
    if (!EDITABLE_STATUSES.has(record.status)) return res.status(409).json({ message: "Record is already confirmed" });
    const dentist = await getDentistProfile(req.user.id);
    if (!dentist || Number(dentist.id) !== Number(record.dentist_id)) return res.status(403).json({ message: "Only the responsible dentist can confirm" });
    if (!hasConfirmationContent(record)) return res.status(400).json({ message: "Diagnosis and treatment are required before confirmation" });
    const data = await withMedicalRecordTransaction(async (db) => {
      await updateMedicalRecordStatus(record.id, "Confirmed", req.user.id, db);
      await completeAppointment(record.appointment_id, db);
      await createMedicalRecordAuditLog({ medicalRecordId: record.id, action: "CONFIRMED", changedByUserId: req.user.id, oldData: { status: record.status }, newData: { status: "Confirmed" } }, db);
      return getMedicalRecordById(record.id, db);
    });
    return res.json({ message: "Medical record confirmed", data });
  } catch (error) {
    console.error("confirmMedicalRecord failed:", error);
    return res.status(500).json({
      message: "Không thể xác nhận bệnh án. Vui lòng thử lại.",
    });
  }
};

// audit log (chi nguoi co quyen tren ho so moi xem duoc)
const getMedicalRecordAudit = async (req, res) => {
  try {
    const record = await getMedicalRecordById(parseId(req.params.id));
    if (!record) return res.status(404).json({ message: "Medical record not found" });
    if (!(await canAccessRecord(req, record))) return res.status(403).json({ message: "You do not have permission" });
    return res.json({ data: await getMedicalRecordAuditLogs(record.id) });
  } catch (error) {
    return res.status(500).json({ message: "Cannot load audit logs" });
  }
};

// upload attachment (file gan voi ho so dieu tri)
const uploadMedicalRecordAttachment = async (req, res) => {
  try {
    const record = await getMedicalRecordById(parseId(req.params.recordId));
    if (!record) return res.status(404).json({ message: "Medical record not found" });
    if (!(await canAccessRecord(req, record))) return res.status(403).json({ message: "You do not have permission" });
    if (!req.file) return res.status(400).json({ message: "File is required" });
    const attachment = await withMedicalRecordTransaction(async (db) => {
      const file = await createMedicalRecordAttachment({
        medical_record_id: record.id,
        file_name: req.file.originalname,
        file_url: `/uploads/medical-records/${req.file.filename}`,
        file_type: req.file.mimetype,
        uploaded_by_user_id: req.user.id,
      }, db);
      await createMedicalRecordAuditLog({ medicalRecordId: record.id, action: "ATTACHMENT_UPLOADED", changedByUserId: req.user.id, newData: { file_name: file.file_name } }, db);
      return file;
    });
    return res.status(201).json({ message: "Attachment uploaded", data: attachment });
  } catch (error) {
    return res.status(500).json({ message: "Cannot upload attachment" });
  }
};

module.exports = {
  listMedicalRecords,
  getMedicalRecordDetail,
  getMedicalResultsByPatientId,
  getPatientDentalChart,
  addMedicalRecord,
  editMedicalRecord,
  confirmMedicalRecord,
  getMedicalRecordAudit,
  uploadMedicalRecordAttachment,
};
