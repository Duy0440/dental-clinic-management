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
  getAppointmentDetailsById,
  checkAppointmentConflictForUpdate,
  updateAppointmentByAdmin,
  getAppointmentsByDentistId,
} = require("../models/appointmentModel");

// xu ly nghiep vu lich hen
const {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
  notifyAppointmentTransition,
} = require("../services/appointmentNotificationService");

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
  findPatientByPhone,
} = require("../models/patientModel");

const {
  getClinicBookingTimeOptions,
  getClinicDayInfo,
  isClinicBookingTime,
  isPastClinicDate,
  isPastClinicDateTime,
  normalizeTime,
} = require("../utils/clinicSchedule");

const VALID_APPOINTMENT_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

const runAppointmentNotification = async (callback, eventName) => {
  try {
    await callback();
  } catch (error) {
    console.error(`[appointment-notification] ${eventName} failed`, {
      name: error.name,
      code: error.code || null,
      ...(process.env.NODE_ENV !== "production"
        ? { message: error.message }
        : {}),
    });
  }
};

const toAppointmentResponse = (appointment) => {
  if (!appointment) return appointment;

  const publicAppointment = { ...appointment };
  delete publicAppointment.patient_user_id;
  delete publicAppointment.dentist_user_id;

  return publicAppointment;
};

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

    let finalPatientId = patient_id ? Number(patient_id) : null;
    const normalizedDentistId = dentist_id ? Number(dentist_id) : null;
    let bookingSource = req.user?.role === "admin" ? "admin" : "website";

    // auth scope (khoa theo ho so ca nhan dang nhap)
    if (req.user?.role === "customer") {
      bookingSource = "customer";
      const patientProfile = await findPatientByUserId(req.user.id);

      if (!patientProfile || patientProfile.id !== Number(patient_id)) {
        return res.status(403).json({
          message:
            "You can only create appointments for your own patient profile",
        });
      }

      finalPatientId = patientProfile.id;
    } else if (!finalPatientId) {
      // guest booking (dat lich ngoai website bang ten va so dien thoai)
      const guestName = guest_full_name?.trim();
      const guestPhone = guest_phone?.trim();

      if (!guestName || !guestPhone) {
        return res.status(400).json({
          message: "Guest full name and phone number are required",
        });
      }

      // reuse old profile (khach quay lai thi dung lai ho so cu)
      const existingPatient = await findPatientByPhone(guestPhone);

      if (existingPatient) {
        finalPatientId = existingPatient.id;
      } else {
        const newPatient = await createPatient({
          user_id: null,
          full_name: guestName,
          phone: guestPhone,
          gender: null,
          birth_date: null,
          address: null,
        });

        finalPatientId = newPatient.id;
      }
    }

    const normalizedStatus =
      req.user?.role === "admin" ? status || "Pending" : "Pending";
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

    if (isPastClinicDateTime(appointment_date, normalizedAppointmentTime)) {
      return res.status(400).json({
        message: "Không thể đặt lịch cho khung giờ đã qua. Bạn vui lòng chọn giờ còn trống phía sau thời điểm hiện tại.",
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
            booking_source: bookingSource,
            note,
          },
          client,
        );
      },
    );

    const appointmentDetails =
      (await getAppointmentDetailsById(newAppointment.id)) || newAppointment;

    if (req.user?.role !== "admin") {
      await runAppointmentNotification(
        () =>
          notifyAppointmentCreated(appointmentDetails, {
            notifyCustomer: req.user?.role === "customer",
          }),
        "created",
      );
    }

    res.status(201).json({
      message: "Appointment created successfully",
      data: toAppointmentResponse(appointmentDetails),
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

    const appointmentDetails =
      (await getAppointmentDetailsById(cancelledAppointment.id)) ||
      cancelledAppointment;

    await runAppointmentNotification(
      () => notifyAppointmentCancelled(appointmentDetails),
      "customer-cancelled",
    );

    res.status(200).json({
      message: "Appointment cancelled successfully",
      data: toAppointmentResponse(appointmentDetails),
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
    const {
      appointment_date,
      appointment_time,
      dentist_id,
      status,
      clinic_note,
      force_assign,
    } = req.body;

    const allowedStatuses = ["Pending", "Confirmed", "Cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    const appointment = await getAppointmentDetailsById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (["Completed", "Cancelled"].includes(appointment.status)) {
      return res.status(409).json({
        code: "APPOINTMENT_LOCKED",
        message: "Lịch đã hoàn thành hoặc đã hủy nên không thể thay đổi ngày giờ.",
      });
    }

    const nextAppointmentDate = appointment_date ?? appointment.appointment_date;
    const rawAppointmentTime = appointment_time ?? appointment.appointment_time;
    const normalizedAppointmentTime = normalizeTime(rawAppointmentTime);
    const dayInfo = getClinicDayInfo(nextAppointmentDate);
    const hasValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(
      String(nextAppointmentDate || ""),
    );
    const hasValidTimeFormat = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(
      String(rawAppointmentTime || ""),
    );

    if (!hasValidDateFormat || !dayInfo.isValid) {
      return res.status(400).json({
        message: "Ngày khám không hợp lệ.",
      });
    }

    if (!hasValidTimeFormat) {
      return res.status(400).json({
        message: "Giờ khám không đúng định dạng.",
      });
    }

    const scheduleChanged =
      String(appointment.appointment_date) !== String(nextAppointmentDate) ||
      normalizeTime(appointment.appointment_time) !== normalizedAppointmentTime;

    if (scheduleChanged && dayInfo.isClosed) {
      return res.status(400).json({
        message: dayInfo.message,
      });
    }

    if (
      scheduleChanged &&
      isPastClinicDateTime(nextAppointmentDate, normalizedAppointmentTime)
    ) {
      return res.status(400).json({
        message: "Không thể chuyển lịch sang ngày hoặc giờ đã qua.",
      });
    }

    if (
      scheduleChanged &&
      !isClinicBookingTime(nextAppointmentDate, normalizedAppointmentTime)
    ) {
      return res.status(400).json({
        message:
          "Giờ khám phải nằm trong thời gian làm việc 08:00-12:00 hoặc 13:30-18:00 và đúng khung 30 phút.",
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

    const updateResult = await withAppointmentSlotLock(
      nextAppointmentDate,
      normalizedAppointmentTime,
      async (client) => {
        const currentAppointment = await getAppointmentDetailsById(
          appointmentId,
          client,
          { forUpdate: true },
        );

        if (!currentAppointment) {
          throw createAppointmentError("Không tìm thấy lịch hẹn.", 404);
        }

        if (["Completed", "Cancelled"].includes(currentAppointment.status)) {
          throw createAppointmentError(
            "Lịch đã hoàn thành hoặc đã hủy nên không thể thay đổi ngày giờ.",
            409,
            { code: "APPOINTMENT_LOCKED" },
          );
        }

        const hasConflict =
          status !== "Cancelled" &&
          (await checkAppointmentConflictForUpdate(
            normalizedDentistId,
            nextAppointmentDate,
            normalizedAppointmentTime,
            appointmentId,
            client,
          ));

        if (hasConflict) {
          throw createAppointmentError(
            "Nha sĩ đã có lịch hẹn vào thời gian này. Vui lòng chọn giờ khác hoặc phân công nha sĩ khác.",
            409,
            { code: "DENTIST_HAS_APPOINTMENT" },
          );
        }

        const isDentistUnavailable =
          status !== "Cancelled" &&
          (await checkDentistUnavailableConflict(
            normalizedDentistId,
            nextAppointmentDate,
            normalizedAppointmentTime,
            client,
          ));

        if (isDentistUnavailable && !force_assign) {
          throw createAppointmentError(
            "Nha sĩ đã báo bận vào thời gian này. Vui lòng chọn giờ khác hoặc phân công nha sĩ khác.",
            409,
            { code: "DENTIST_UNAVAILABLE" },
          );
        }

        await updateAppointmentByAdmin(
          appointmentId,
          nextAppointmentDate,
          normalizedAppointmentTime,
          normalizedDentistId,
          status,
          clinic_note,
          client,
        );

        return {
          previousAppointment: currentAppointment,
          usedUnavailableOverride: isDentistUnavailable && force_assign,
        };
      },
    );

    const updatedAppointment = await getAppointmentDetailsById(appointmentId);

    await runAppointmentNotification(
      () =>
        notifyAppointmentTransition(
          updateResult.previousAppointment,
          updatedAppointment,
        ),
      "updated",
    );

    res.status(200).json({
      message: "Appointment updated successfully",
      data: toAppointmentResponse(updatedAppointment),
      warning: updateResult.usedUnavailableOverride
        ? "Appointment assigned with admin override"
        : null,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      code: error.code,
      message: statusCode === 500 ? "Server error" : error.message,
      error: statusCode === 500 ? error.message : undefined,
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
