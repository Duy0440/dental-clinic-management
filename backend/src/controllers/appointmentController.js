const {
  getAppointmentHistoryByPatientId,
  getAllAppointments,
  withAppointmentSlotLock,
  createAppointment,
  checkAppointmentReferences,
  checkDentistAppointmentConflict,
  getBookedAppointmentSlotsByDate,
  getUnavailableBlocksByDate,
  cancelAppointmentById,
  findAppointmentById,
  checkAppointmentConflictForUpdate,
  updateAppointmentByAdmin,
  getAppointmentsByDentistId,
} = require("../models/appointmentModel");

const {
  findDentistById,
  findDentistByUserId,
  getActiveDentists,
} = require("../models/dentistModel");

const {
  checkDentistUnavailableConflict,
} = require("../models/dentistUnavailableModel");

const {
  findPatientByUserId,
  createPatient,
} = require("../models/patientModel");

const {
  getClinicBookingTimeOptions,
  getClinicDayInfo,
  isClinicBookingTime,
  isPastClinicDate,
  normalizeTime,
} = require("../utils/clinicSchedule");

const VALID_APPOINTMENT_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

// custom error (loi rieng cho dat lịch)
const createAppointmentError = (message, statusCode = 409, extra = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
};

const isTimeInsideBlock = (time, block) => {
  const startTime = normalizeTime(block.start_time);
  const endTime = normalizeTime(block.end_time);

  if (!startTime && !endTime) {
    return true;
  }

  return time >= startTime && time < endTime;
};

// available slots (tinh gio con trong)
const buildAvailableTimes = async (appointmentDate, dentistId = null) => {
  const dayInfo = getClinicDayInfo(appointmentDate);
  const timeOptions = getClinicBookingTimeOptions(appointmentDate);

  if (!dayInfo.isValid || dayInfo.isClosed || isPastClinicDate(appointmentDate)) {
    return {
      activeDentistCount: 0,
      availableTimes: [],
      blockedTimes: [],
      dayInfo,
      message: isPastClinicDate(appointmentDate)
        ? "Không thể đặt lịch cho ngày đã qua."
        : dayInfo.message,
    };
  }

  const activeDentists = await getActiveDentists();
  const normalizedDentistId = dentistId ? Number(dentistId) : null;

  const targetDentists = normalizedDentistId
    ? activeDentists.filter((dentist) => dentist.id === normalizedDentistId)
    : activeDentists;

  if (!targetDentists.length) {
    return {
      activeDentistCount: activeDentists.length,
      availableTimes: [],
      blockedTimes: timeOptions,
      dayInfo,
      message: "Hiện chưa có nha sĩ phù hợp để nhận lịch ngày này.",
    };
  }

  const targetDentistIds = targetDentists.map((dentist) => dentist.id);
  const activeDentistIds = activeDentists.map((dentist) => dentist.id);
  const bookedSlots = await getBookedAppointmentSlotsByDate(appointmentDate, null);
  const unavailableBlocks = await getUnavailableBlocksByDate(appointmentDate, null);

  const bookedKeys = new Set(
    bookedSlots
      .filter((slot) => slot.dentist_id)
      .map(
        (slot) => `${slot.dentist_id}-${normalizeTime(slot.appointment_time)}`,
      ),
  );

  const isDentistFreeAtTime = (dentistIdToCheck, time) => {
    const hasAppointment = bookedKeys.has(`${dentistIdToCheck}-${time}`);
    const isUnavailable = unavailableBlocks.some(
      (block) =>
        block.dentist_id === dentistIdToCheck && isTimeInsideBlock(time, block),
    );

    return !hasAppointment && !isUnavailable;
  };

  const countUnassignedAppointmentsAtTime = (time) =>
    bookedSlots.filter(
      (slot) => !slot.dentist_id && normalizeTime(slot.appointment_time) === time,
    ).length;

  const countFreeDentistsAtTime = (time) =>
    activeDentistIds.filter((dentistIdToCheck) =>
      isDentistFreeAtTime(dentistIdToCheck, time),
    ).length;

  const availableTimes = timeOptions.filter((time) => {
    const unassignedAppointmentCount = countUnassignedAppointmentsAtTime(time);
    const freeDentistCount = countFreeDentistsAtTime(time);

    if (normalizedDentistId) {
      return (
        targetDentistIds.some((dentistIdToCheck) =>
          isDentistFreeAtTime(dentistIdToCheck, time),
        ) && unassignedAppointmentCount < freeDentistCount
      );
    }

    return unassignedAppointmentCount < freeDentistCount;
  });

  return {
    activeDentistCount: activeDentists.length,
    availableTimes,
    blockedTimes: timeOptions.filter((time) => !availableTimes.includes(time)),
    dayInfo,
    message: availableTimes.length
      ? `Còn ${availableTimes.length} khung giờ có thể đặt trong ngày này.`
      : "Ngày này đã hết khung giờ nhận lịch online, bạn vui lòng chọn ngày khác.",
  };
};

// slot API (tra danh sach gio cho frontend)
const getAvailableAppointmentTimes = async (req, res) => {
  try {
    const { date, dentist_id } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Appointment date is required",
      });
    }

    if (dentist_id) {
      const dentist = await findDentistById(Number(dentist_id));

      if (!dentist || !dentist.is_active || !dentist.user_is_active) {
        return res.status(404).json({
          message: "Dentist not found or inactive",
        });
      }
    }

    const availability = await buildAvailableTimes(date, dentist_id || null);

    res.status(200).json({
      message: "Available appointment times fetched successfully",
      data: {
        date,
        dentist_id: dentist_id ? Number(dentist_id) : null,
        available_times: availability.availableTimes,
        blocked_times: availability.blockedTimes,
        is_fully_booked: availability.availableTimes.length === 0,
        is_closed: availability.dayInfo?.isClosed || false,
        day_label: availability.dayInfo?.dayLabel || "",
        message: availability.message,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// auth scope (khach chi xem lich cua minh)
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

// create appointment (tao lich)
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

    // auth scope (khoa theo ho so ca nhan dang nhap)
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
      // guest booking (tao ho so cho khach vang lai)
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
    const normalizedAppointmentTime = normalizeTime(appointment_time);

    if (!VALID_APPOINTMENT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    if (isPastClinicDate(appointment_date)) {
      return res.status(400).json({
        message: "Không thể đặt lịch cho ngày đã qua.",
      });
    }

    // validate time (kiem tra gio nhan lich online)
    if (!isClinicBookingTime(appointment_date, normalizedAppointmentTime)) {
      const dayInfo = getClinicDayInfo(appointment_date);
      return res.status(400).json({
        message: dayInfo.isClosed
          ? dayInfo.message
          : "Phòng khám chỉ nhận lịch online từ 08:00-12:00 và 13:30-18:00. Bạn vui lòng chọn khung giờ khác.",
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

    // pre-check slot (kiểm tra slot)
    const availability = await buildAvailableTimes(
      appointment_date,
      normalizedDentistId,
    );

    if (!availability.availableTimes.includes(normalizedAppointmentTime)) {
      return res.status(409).json({
        message:
          availability.availableTimes.length > 0
            ? `Khung giờ ${normalizedAppointmentTime} đã có lịch hoặc nha sĩ bận. Các giờ còn trống: ${availability.availableTimes.join(", ")}.`
            : availability.message || "Ngày này đã hết khung giờ phù hợp. Vui lòng chọn ngày khác để đặt lịch.",
        available_times: availability.availableTimes,
      });
    }

    // conflict check (check trùng lịch nha sĩ)
    const hasConflict = await checkDentistAppointmentConflict(
      normalizedDentistId,
      appointment_date,
      normalizedAppointmentTime,
    );

    if (hasConflict) {
      return res.status(409).json({
        message:
          "Nha sĩ này đã có lịch hẹn vào khung giờ bạn chọn. Vui lòng chọn giờ khác hoặc để phòng khám sắp xếp nha sĩ phù hợp.",
      });
    }

    // unavailable check (check lịch bận nha sĩ)
    const isDentistUnavailable =
      normalizedDentistId &&
      (await checkDentistUnavailableConflict(
        normalizedDentistId,
        appointment_date,
        normalizedAppointmentTime,
      ));

    if (isDentistUnavailable) {
      return res.status(409).json({
        message:
          "Nha sĩ này đã báo bận vào thời gian bạn chọn. Vui lòng chọn nha sĩ khác hoặc để phòng khám sắp xếp.",
      });
    }

    // race condition guard (khóa slot khi nhieu lich dạt cung thoi diem)
    const newAppointment = await withAppointmentSlotLock(
      appointment_date,
      normalizedAppointmentTime,
      async (client) => {
        const lockedAvailability = await buildAvailableTimes(
          appointment_date,
          normalizedDentistId,
        );

        if (!lockedAvailability.availableTimes.includes(normalizedAppointmentTime)) {
          throw createAppointmentError(
            lockedAvailability.availableTimes.length > 0
              ? `Khung giờ ${normalizedAppointmentTime} vừa có người đặt. Các giờ còn trống: ${lockedAvailability.availableTimes.join(", ")}.`
              : lockedAvailability.message || "Ngày này đã hết khung giờ phù hợp. Vui lòng chọn ngày khác để đặt lịch.",
            409,
            { availableTimes: lockedAvailability.availableTimes },
          );
        }

        const lockedHasConflict = await checkDentistAppointmentConflict(
          normalizedDentistId,
          appointment_date,
          normalizedAppointmentTime,
        );

        if (lockedHasConflict) {
          throw createAppointmentError(
            "Nha sĩ này vừa có lịch hẹn vào khung giờ bạn chọn. Vui lòng chọn giờ khác hoặc để phòng khám sắp xếp nha sĩ phù hợp.",
          );
        }

        const lockedDentistUnavailable =
          normalizedDentistId &&
          (await checkDentistUnavailableConflict(
            normalizedDentistId,
            appointment_date,
            normalizedAppointmentTime,
          ));

        if (lockedDentistUnavailable) {
          throw createAppointmentError(
            "Nha sĩ này vừa báo bận vào thời gian bạn chọn. Vui lòng chọn nha sĩ khác hoặc để phòng khám sắp xếp.",
          );
        }

        return createAppointment(
          {
            patient_id: finalPatientId,
            dentist_id: normalizedDentistId,
            service_id,
            appointment_date,
            appointment_time: normalizedAppointmentTime,
            status: normalizedStatus,
            note,
          },
          client,
        );
      },
    );

    res.status(201).json({
      message: "Appointment created successfully",
      data: newAppointment,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: statusCode === 500 ? "Server error" : error.message,
      error: statusCode === 500 ? error.message : undefined,
      available_times: error.availableTimes,
    });
  }
};

// cancel appointment 
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



// admin list (xem danh sách lịch)
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

// admin update (phân công lịch)
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

    // validate dentist (xác nhận lịch phải có nha sĩ)
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

    // conflict check (báo trùng khi phân công)
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

    // unavailable check (báo nha sĩ đang bận)
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

// dentist schedule (nha sĩ xem lịch được phân công)
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
  getAvailableAppointmentTimes,
  getAppointmentsForAdmin,
  cancelAppointment,
  manageAppointment,
  getAppointmentsForDentist,
};
