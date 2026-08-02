// gui thong bao theo trang thai lich hen
const pool = require("../config/db");
const { createNotification } = require("../models/notificationModel");

const ACTION_URLS = {
  admin: "/admin/appointments",
  customer: "/my-appointments",
  dentist: "/dentist/appointments",
};

const formatDate = (value) => {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value);
};

const formatTime = (value) => String(value || "").slice(0, 5);

const getScheduleText = (appointment) =>
  `${formatTime(appointment.appointment_time)} ngày ${formatDate(
    appointment.appointment_date,
  )}`;

const getActiveAdminUserIds = async () => {
  const result = await pool.query(`
    SELECT id
    FROM users
    WHERE role = 'admin'
      AND is_active = TRUE
  `);

  return result.rows.map((user) => user.id);
};

const insertNotifications = async (notifications) => {
  if (!notifications.length) return [];

  const results = await Promise.allSettled(
    notifications.map((notification) => createNotification(notification)),
  );
  const failedCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

  if (failedCount > 0) {
    throw new Error(`Failed to create ${failedCount} appointment notifications`);
  }

  return results.map((result) => result.value).filter(Boolean);
};

const buildNotification = ({
  userId,
  type,
  title,
  message,
  actionUrl,
  appointmentId,
  dedupeKey,
}) => ({
  user_id: userId,
  type,
  title,
  message,
  related_entity_type: "appointment",
  related_entity_id: appointmentId,
  action_url: actionUrl,
  dedupe_key: dedupeKey,
});

const notifyAppointmentCreated = async (
  appointment,
  { notifyCustomer = false } = {},
) => {
  const adminUserIds = await getActiveAdminUserIds();
  const notifications = adminUserIds.map((adminUserId) =>
    buildNotification({
      userId: adminUserId,
      type: "APPOINTMENT_REQUEST_CREATED",
      title: "Có yêu cầu đặt lịch mới",
      message: `Khách ${appointment.patient_name} vừa gửi yêu cầu đặt lịch ngày ${formatDate(
        appointment.appointment_date,
      )} lúc ${formatTime(appointment.appointment_time)}.`,
      actionUrl: ACTION_URLS.admin,
      appointmentId: appointment.id,
      dedupeKey: `appointment-request-${appointment.id}-admin-${adminUserId}`,
    }),
  );

  if (notifyCustomer && appointment.patient_user_id) {
    notifications.push(
      buildNotification({
        userId: appointment.patient_user_id,
        type: "APPOINTMENT_REQUEST_SUBMITTED",
        title: "Yêu cầu đặt lịch đã được tiếp nhận",
        message: `Yêu cầu khám ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(
          appointment.appointment_time,
        )} đang chờ phòng khám xác nhận.`,
        actionUrl: ACTION_URLS.customer,
        appointmentId: appointment.id,
        dedupeKey: `appointment-submitted-${appointment.id}-customer-${appointment.patient_user_id}`,
      }),
    );
  }

  return insertNotifications(notifications);
};

const notifyDentistAssigned = (appointment, changeFingerprint = null) => {
  if (!appointment.dentist_user_id) return null;

  return buildNotification({
    userId: appointment.dentist_user_id,
    type: "DENTIST_APPOINTMENT_ASSIGNED",
    title: "Bạn có lịch khám mới",
    message: `Bạn được phân công khám cho khách ${
      appointment.patient_name
    } vào ngày ${formatDate(appointment.appointment_date)} lúc ${formatTime(
      appointment.appointment_time,
    )}.`,
    actionUrl: ACTION_URLS.dentist,
    appointmentId: appointment.id,
    dedupeKey: `appointment-assigned-${appointment.id}-dentist-${appointment.dentist_user_id}${
      changeFingerprint ? `-${changeFingerprint}` : ""
    }`,
  });
};

const notifyAppointmentConfirmed = async (appointment) => {
  const notifications = [];

  if (appointment.patient_user_id) {
    notifications.push(
      buildNotification({
        userId: appointment.patient_user_id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Lịch hẹn đã được xác nhận",
        message: `Lịch khám của bạn vào ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(appointment.appointment_time)}${
          appointment.dentist_name ? ` với ${appointment.dentist_name}` : ""
        } đã được xác nhận.`,
        actionUrl: ACTION_URLS.customer,
        appointmentId: appointment.id,
        dedupeKey: `appointment-confirmed-${appointment.id}-customer-${appointment.patient_user_id}`,
      }),
    );
  }

  const dentistNotification = notifyDentistAssigned(appointment);
  if (dentistNotification) notifications.push(dentistNotification);

  return insertNotifications(notifications);
};

const notifyAppointmentCancelled = async (appointment) => {
  const notifications = [];

  if (appointment.patient_user_id) {
    notifications.push(
      buildNotification({
        userId: appointment.patient_user_id,
        type: "APPOINTMENT_CANCELLED",
        title: "Lịch hẹn đã bị hủy",
        message: `Lịch khám ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(appointment.appointment_time)} đã bị hủy.`,
        actionUrl: ACTION_URLS.customer,
        appointmentId: appointment.id,
        dedupeKey: `appointment-cancelled-${appointment.id}-customer-${appointment.patient_user_id}`,
      }),
    );
  }

  if (appointment.dentist_user_id) {
    notifications.push(
      buildNotification({
        userId: appointment.dentist_user_id,
        type: "APPOINTMENT_CANCELLED",
        title: "Lịch khám đã được hủy",
        message: `Lịch của ${appointment.patient_name} lúc ${getScheduleText(
          appointment,
        )} đã được hủy.`,
        actionUrl: ACTION_URLS.dentist,
        appointmentId: appointment.id,
        dedupeKey: `appointment-cancelled-${appointment.id}-dentist-${appointment.dentist_user_id}`,
      }),
    );
  }

  return insertNotifications(notifications);
};

const notifyAppointmentUpdated = async (
  previous,
  appointment,
  { notifyDentists = true } = {},
) => {
  const notifications = [];
  const previousFingerprint = [
    previous.appointment_date,
    formatTime(previous.appointment_time),
    previous.dentist_id || 0,
    previous.service_id,
  ].join("-");
  const nextFingerprint = [
    appointment.appointment_date,
    formatTime(appointment.appointment_time),
    appointment.dentist_id || 0,
    appointment.service_id,
  ].join("-");
  const updateFingerprint = `${previousFingerprint}-to-${nextFingerprint}`;
  const dentistChanged =
    Number(previous.dentist_id || 0) !== Number(appointment.dentist_id || 0);
  const scheduleOrServiceChanged =
    String(previous.appointment_date) !== String(appointment.appointment_date) ||
    formatTime(previous.appointment_time) !==
      formatTime(appointment.appointment_time) ||
    Number(previous.service_id) !== Number(appointment.service_id);

  if (appointment.patient_user_id) {
    notifications.push(
      buildNotification({
        userId: appointment.patient_user_id,
        type: "APPOINTMENT_UPDATED",
        title: "Lịch hẹn đã được cập nhật",
        message: `Lịch khám của bạn đã được cập nhật sang ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(appointment.appointment_time)}.${
          dentistChanged && appointment.dentist_name
            ? ` Nha sĩ phụ trách: ${appointment.dentist_name}.`
            : ""
        }`,
        actionUrl: ACTION_URLS.customer,
        appointmentId: appointment.id,
        dedupeKey: `appointment-updated-${appointment.id}-customer-${appointment.patient_user_id}-${updateFingerprint}`,
      }),
    );
  }

  if (!notifyDentists) {
    return insertNotifications(notifications);
  }

  if (dentistChanged && appointment.dentist_user_id) {
    const dentistNotification = notifyDentistAssigned(
      appointment,
      updateFingerprint,
    );
    if (dentistNotification) notifications.push(dentistNotification);
  }

  if (dentistChanged && previous.dentist_user_id) {
    notifications.push(
      buildNotification({
        userId: previous.dentist_user_id,
        type: "APPOINTMENT_UPDATED",
        title: "Lịch khám đã được điều chuyển",
        message: `Lịch khám của khách ${appointment.patient_name} vào ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(
          appointment.appointment_time,
        )} không còn được phân công cho bạn.`,
        actionUrl: ACTION_URLS.dentist,
        appointmentId: appointment.id,
        dedupeKey: `appointment-unassigned-${appointment.id}-dentist-${previous.dentist_user_id}-${updateFingerprint}`,
      }),
    );
  }

  if (
    !dentistChanged &&
    scheduleOrServiceChanged &&
    appointment.dentist_user_id
  ) {
    notifications.push(
      buildNotification({
        userId: appointment.dentist_user_id,
        type: "APPOINTMENT_UPDATED",
        title: "Lịch khám đã được cập nhật",
        message: `Lịch khám của khách ${appointment.patient_name} được cập nhật sang ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(appointment.appointment_time)}.`,
        actionUrl: ACTION_URLS.dentist,
        appointmentId: appointment.id,
        dedupeKey: `appointment-updated-${appointment.id}-dentist-${appointment.dentist_user_id}-${updateFingerprint}`,
      }),
    );
  }

  return insertNotifications(notifications);
};

const notifyAppointmentTransition = async (previous, appointment) => {
  if (previous.status !== "Cancelled" && appointment.status === "Cancelled") {
    return notifyAppointmentCancelled(appointment);
  }

  const importantDetailsChanged =
    Number(previous.dentist_id || 0) !== Number(appointment.dentist_id || 0) ||
    String(previous.appointment_date) !== String(appointment.appointment_date) ||
    formatTime(previous.appointment_time) !==
      formatTime(appointment.appointment_time) ||
    Number(previous.service_id) !== Number(appointment.service_id);

  if (previous.status !== "Confirmed" && appointment.status === "Confirmed") {
    const confirmedNotifications = await notifyAppointmentConfirmed(appointment);

    if (!importantDetailsChanged) {
      return confirmedNotifications;
    }

    const updatedNotifications = await notifyAppointmentUpdated(
      previous,
      appointment,
      { notifyDentists: false },
    );
    return [...confirmedNotifications, ...updatedNotifications];
  }

  if (importantDetailsChanged) {
    return notifyAppointmentUpdated(previous, appointment);
  }

  return [];
};

module.exports = {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
  notifyAppointmentTransition,
};
