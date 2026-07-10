const {
  getAllMedicalRecords,
  getMedicalRecordsByPatientId,
  createMedicalRecord,
  checkMedicalRecordReferences,
  findMedicalRecordByAppointmentId,
  checkReExaminationConflict,
} = require("../models/medicalRecordModel");

const {
  markAppointmentCompletedById,
  checkDentistAppointmentConflict,
} = require("../models/appointmentModel");

const {
  checkDentistUnavailableConflict,
} = require("../models/dentistUnavailableModel");

const {
  createMedicalRecordAttachment,
} = require("../models/medicalRecordAttachmentModel");

const { findPatientByUserId } = require("../models/patientModel");
const { findDentistByUserId } = require("../models/dentistModel");
const {
  getClinicDayInfo,
  isClinicBookingTime,
  isPastClinicDate,
  normalizeTime,
} = require("../utils/clinicSchedule");

const listMedicalRecords = async (req, res) => {
  try {
    let records = await getAllMedicalRecords();

    if (req.user.role === "dentist") {
      const dentistProfile = await findDentistByUserId(req.user.id);

      if (!dentistProfile) {
        return res.status(404).json({
          message: "Dentist profile not found",
        });
      }

      records = records.filter(
        (record) => Number(record.dentist_id) === Number(dentistProfile.id),
      );
    }

    res.status(200).json({
      message: "Medical records fetched successfully",
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getMedicalResultsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user?.role === "customer") {
      const patientProfile = await findPatientByUserId(req.user.id);

      if (!patientProfile || patientProfile.id !== Number(patientId)) {
        return res.status(403).json({
          message: "You can only view your own medical results",
        });
      }
    }

    const records = await getMedicalRecordsByPatientId(patientId);

    res.status(200).json({
      message: "Medical results fetched successfully",
      data: records,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addMedicalRecord = async (req, res) => {
  try {
    const {
      appointment_id,
      patient_id,
      dentist_id,
      diagnosis,
      treatment,
      note,
      re_examination_date,
      re_examination_time,
      attachment_url,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        message: "Customer ID is required",
      });
    }

    let finalDentistId = dentist_id;

    if (req.user.role === "dentist") {
      const dentistProfile = await findDentistByUserId(req.user.id);

      if (!dentistProfile) {
        return res.status(404).json({
          message: "Dentist profile not found",
        });
      }

      finalDentistId = dentistProfile.id;
    }

    if (!finalDentistId) {
      return res.status(400).json({
        message: "Responsible dentist is required",
      });
    }

    const { patientExists, dentistExists, appointmentExists } =
      await checkMedicalRecordReferences(
        patient_id,
        finalDentistId,
        appointment_id,
      );

    if (!patientExists) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (!dentistExists) {
      return res.status(404).json({
        message: "Dentist not found",
      });
    }

    if (!appointmentExists) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (appointment_id) {
      const existingRecord = await findMedicalRecordByAppointmentId(
        appointment_id,
      );

      if (existingRecord) {
        return res.status(409).json({
          message: "This appointment already has a medical record",
        });
      }
    }

    const normalizedReExaminationTime = normalizeTime(re_examination_time);

    if (
      (re_examination_date && !normalizedReExaminationTime) ||
      (!re_examination_date && normalizedReExaminationTime)
    ) {
      return res.status(400).json({
        message: "Vui lòng chọn đủ ngày và giờ tái khám, hoặc bỏ trống cả hai.",
      });
    }

    if (re_examination_date && normalizedReExaminationTime) {
      if (isPastClinicDate(re_examination_date)) {
        return res.status(400).json({
          message: "Không thể đề xuất tái khám vào ngày đã qua.",
        });
      }

      if (!isClinicBookingTime(re_examination_date, normalizedReExaminationTime)) {
        const dayInfo = getClinicDayInfo(re_examination_date);

        return res.status(400).json({
          message: dayInfo.isClosed
            ? dayInfo.message
            : "Giờ tái khám đề xuất phải nằm trong khung nhận lịch online 08:00-12:00 hoặc 13:30-18:00.",
        });
      }

      const hasReExaminationConflict = await checkReExaminationConflict(
        finalDentistId,
        re_examination_date,
        normalizedReExaminationTime,
      );

      if (hasReExaminationConflict) {
        return res.status(409).json({
          message: "Khung giờ tái khám này đã được dùng cho hồ sơ khác.",
        });
      }

      const hasAppointmentConflict = await checkDentistAppointmentConflict(
        finalDentistId,
        re_examination_date,
        normalizedReExaminationTime,
      );

      if (hasAppointmentConflict) {
        return res.status(409).json({
          message: "Khung giờ tái khám này đã trùng với lịch hẹn khác của nha sĩ.",
        });
      }

      const hasUnavailableConflict = await checkDentistUnavailableConflict(
        finalDentistId,
        re_examination_date,
        normalizedReExaminationTime,
      );

      if (hasUnavailableConflict) {
        return res.status(409).json({
          message: "Nha sĩ đã báo bận vào khung giờ tái khám này.",
        });
      }
    }

    const newRecord = await createMedicalRecord({
      appointment_id,
      patient_id,
      dentist_id: finalDentistId,
      diagnosis,
      treatment,
      note,
      re_examination_date,
      re_examination_time: normalizedReExaminationTime,
      attachment_url,
      entered_by_user_id: req.user.id,
    });

    if (appointment_id) {
      await markAppointmentCompletedById(appointment_id);
    }

    res.status(201).json({
      message: "Medical record created successfully",
      data: newRecord,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const uploadMedicalRecordAttachment = async (req, res) => {
  try {
    const { recordId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    const fileUrl = `/uploads/medical-records/${req.file.filename}`;

    const attachment = await createMedicalRecordAttachment({
      medical_record_id: Number(recordId),
      file_name: req.file.originalname,
      file_url: fileUrl,
      file_type: req.file.mimetype,
      uploaded_by_user_id: req.user.id,
    });

    res.status(201).json({
      message: "Attachment uploaded successfully",
      data: attachment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listMedicalRecords,
  getMedicalResultsByPatientId,
  addMedicalRecord,
  uploadMedicalRecordAttachment,
};
