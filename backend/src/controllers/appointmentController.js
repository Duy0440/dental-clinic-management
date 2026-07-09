const {
  getAppointmentHistoryByPatientId,
  getAllAppointments,
  createAppointment,
  checkAppointmentReferences,
  checkDentistAppointmentConflict,
  cancelAppointmentById,
  findAppointmentById,
  checkAppointmentConflictForUpdate,
  updateAppointmentByAdmin,
  getAppointmentsByDentistId,
} = require("../models/appointmentModel");

const {
  findDentistById,
  findDentistByUserId,
} = require("../models/dentistModel");

const {
  checkDentistUnavailableConflict,
} = require("../models/dentistUnavailableModel");

const {
  findPatientByUserId,
  createPatient,
} = require("../models/patientModel");

const VALID_APPOINTMENT_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const getAppointmentHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user?.role === "customer") {
      const patientProfile = await findPatientByUserId(req.user.id);

      if (!patientProfile || patientProfile.id !== Number(patientId)) {
        return res.status(403).json({
          message: "You can only view your own appointment history",
        });
      }
    }

    const appointments = await getAppointmentHistoryByPatientId(patientId);

    res.status(200).json({
      message: "Appointment history fetched successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      dentist_id,
      service_id,
      appointment_date,
      appointment_time,
      status,
      note,
      guest_full_name,
      guest_phone,
    } = req.body;

    if (!service_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        message: "Please fill in all required appointment fields",
      });
    }

    let finalPatientId = patient_id;
    const normalizedDentistId = dentist_id ? Number(dentist_id) : null;

    if (req.user?.role === "customer") {
      const patientProfile = await findPatientByUserId(req.user.id);

      if (!patientProfile || patientProfile.id !== Number(patient_id)) {
        return res.status(403).json({
          message:
            "You can only create appointments for your own patient profile",
        });
      }

      finalPatientId = patientProfile.id;
    } else if (!req.user) {
      if (!guest_full_name || !guest_phone) {
        return res.status(400).json({
          message: "Guest full name and phone number are required",
        });
      }

      const newPatient = await createPatient({
        user_id: null,
        full_name: guest_full_name,
        phone: guest_phone,
        gender: null,
        birth_date: null,
        address: null,
      });

      finalPatientId = newPatient.id;
    }

    const normalizedStatus = status || "Pending";

    if (!VALID_APPOINTMENT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    const { patientExists, dentistExists, serviceExists } =
      await checkAppointmentReferences(
        finalPatientId,
        normalizedDentistId,
        service_id,
      );

    if (!patientExists) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    if (!dentistExists) {
      return res.status(404).json({
        message: "Dentist not found",
      });
    }

    if (normalizedDentistId) {
      const dentist = await findDentistById(normalizedDentistId);

      if (!dentist?.is_active || !dentist?.user_is_active) {
        return res.status(409).json({
          message: "Dentist is inactive and cannot receive appointments",
        });
      }
    }

    if (!serviceExists) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const hasConflict = await checkDentistAppointmentConflict(
      normalizedDentistId,
      appointment_date,
      appointment_time,
    );

    if (hasConflict) {
      return res.status(409).json({
        message:
          "Nha sĩ này đã có lịch hẹn vào khung giờ bạn chọn. Vui lòng chọn giờ khác hoặc để phòng khám sắp xếp nha sĩ phù hợp.",
      });
    }

    const isDentistUnavailable = await checkDentistUnavailableConflict(
      normalizedDentistId,
      appointment_date,
      appointment_time,
    );

    if (isDentistUnavailable) {
      return res.status(409).json({
        message:
          "Nha sĩ này đã báo bận vào thời gian bạn chọn. Vui lòng chọn nha sĩ khác hoặc để phòng khám sắp xếp.",
      });
    }

    const newAppointment = await createAppointment({
      patient_id: finalPatientId,
      dentist_id: normalizedDentistId,
      service_id,
      appointment_date,
      appointment_time,
      status: normalizedStatus,
      note,
    });

    res.status(201).json({
      message: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!req.user || req.user.role !== "customer") {
      return res.status(403).json({
        message: "Only customers can cancel their appointments",
      });
    }

    const patientProfile = await findPatientByUserId(req.user.id);

    if (!patientProfile) {
      return res.status(404).json({
        message: "Patient profile not found",
      });
    }

    const cancelledAppointment = await cancelAppointmentById(
      appointmentId,
      patientProfile.id,
    );

    if (!cancelledAppointment) {
      return res.status(404).json({
        message: "Appointment not found or cannot be cancelled",
      });
    }

    res.status(200).json({
      message: "Appointment cancelled successfully",
      data: cancelledAppointment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



const getAppointmentsForAdmin = async (req, res) => {
  try {
    const appointments = await getAllAppointments();

    res.status(200).json({
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const manageAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { dentist_id, status, clinic_note, force_assign } = req.body;

    const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    const appointment = await findAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const normalizedDentistId = dentist_id ? Number(dentist_id) : null;

    if (status === "Confirmed" && !normalizedDentistId) {
      return res.status(400).json({
        message: "Please assign a dentist before confirming",
      });
    }

    const { dentistExists } = await checkAppointmentReferences(
      appointment.patient_id,
      normalizedDentistId,
      appointment.service_id,
    );

    if (!dentistExists) {
      return res.status(404).json({
        message: "Dentist not found",
      });
    }

    if (normalizedDentistId) {
      const dentist = await findDentistById(normalizedDentistId);

      if (!dentist?.is_active || !dentist?.user_is_active) {
        return res.status(409).json({
          message: "Dentist is inactive and cannot receive appointments",
        });
      }
    }

    const hasConflict =
      status !== "Cancelled" &&
      (await checkAppointmentConflictForUpdate(
        normalizedDentistId,
        appointment.appointment_date,
        appointment.appointment_time,
        appointmentId,
      ));

    if (hasConflict && !force_assign) {
      return res.status(409).json({
        code: "DENTIST_HAS_APPOINTMENT",
        message:
          "Dentist already has an appointment at this time. Do you still want to assign?",
      });
    }

    const isDentistUnavailable =
      status !== "Cancelled" &&
      (await checkDentistUnavailableConflict(
        normalizedDentistId,
        appointment.appointment_date,
        appointment.appointment_time,
      ));

    if (isDentistUnavailable && !force_assign) {
      return res.status(409).json({
        code: "DENTIST_UNAVAILABLE",
        message:
          "Dentist is marked unavailable at this time. Do you still want to assign?",
      });
    }

    const updatedAppointment = await updateAppointmentByAdmin(
      appointmentId,
      normalizedDentistId,
      status,
      clinic_note,
    );

    res.status(200).json({
      message: "Appointment updated successfully",
      data: updatedAppointment,
      warning:
        hasConflict || isDentistUnavailable
          ? "Appointment assigned with admin override"
          : null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getAppointmentsForDentist = async (req, res) => {
  try {
    const dentistProfile = await findDentistByUserId(req.user.id);

    if (!dentistProfile) {
      return res.status(404).json({
        message: "Dentist profile not found",
      });
    }

    const appointments = await getAppointmentsByDentistId(dentistProfile.id);

    res.status(200).json({
      message: "Dentist appointments fetched successfully",
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAppointmentHistory,
  addAppointment,
  getAppointmentsForAdmin,
  cancelAppointment,
  manageAppointment,
  getAppointmentsForDentist,
};
