// nhac lich hen va tai kham
const pool = require("../config/db");
const { createNotification } = require("../models/notificationModel");

const formatDate = (value) => {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value);
};

const formatTime = (value) => String(value || "").slice(0, 5);

const createSafeNotifications = async (notifications) => {
  if (!notifications.length) return [];

  const results = await Promise.allSettled(
    notifications.map((notification) => createNotification(notification)),
  );
  const failedCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

  if (failedCount > 0) {
    throw new Error(`Failed to create ${failedCount} reminder notifications`);
  }

  return results.map((result) => result.value).filter(Boolean);
};

const buildNotification = ({
  userId,
  type,
  title,
  message,
  relatedEntityType,
  relatedEntityId,
  actionUrl,
  dedupeKey,
}) => ({
  user_id: userId,
  type,
  title,
  message,
  related_entity_type: relatedEntityType,
  related_entity_id: relatedEntityId,
  action_url: actionUrl,
  dedupe_key: dedupeKey,
});

// canh bao lich hoan thanh chua co benh an
const refreshMissingMedicalRecordNotifications = async (user) => {
  if (!["admin", "dentist"].includes(user.role)) return [];

  const roleFilter =
    user.role === "dentist" ? "AND d.user_id = $1" : "AND $1::integer IS NOT NULL";

  const result = await pool.query(
    `
      SELECT
        a.id AS appointment_id,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
        TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
        p.full_name AS patient_name,
        d.user_id AS dentist_user_id
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN dentists d ON d.id = a.dentist_id
      LEFT JOIN medical_records mr ON mr.appointment_id = a.id
      WHERE a.status = 'Completed'
        AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
        AND a.appointment_date <= CURRENT_DATE + INTERVAL '1 day'
        AND mr.id IS NULL
        ${roleFilter}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 50
    `,
    [user.id],
  );

  const notifications = result.rows.map((appointment) =>
    buildNotification({
      userId: user.id,
      type: "MEDICAL_RECORD_MISSING",
      title: "Lịch khám chưa có kết quả điều trị",
      message: `Lịch khám của khách ${appointment.patient_name} ngày ${formatDate(
        appointment.appointment_date,
      )} đã hoàn thành nhưng chưa có bệnh án.`,
      relatedEntityType: "appointment",
      relatedEntityId: appointment.appointment_id,
      actionUrl:
        user.role === "admin"
          ? `/admin/appointments?appointment_id=${appointment.appointment_id}`
          : "/dentist/appointments",
      dedupeKey: `medical-record-missing-${appointment.appointment_id}-user-${user.id}`,
    }),
  );

  return createSafeNotifications(notifications);
};

// nhac lich kham trong 24 gio
const refreshAppointmentReminders = async (user) => {
  if (!["customer", "dentist"].includes(user.role)) return [];

  const roleFilter =
    user.role === "customer" ? "AND p.user_id = $1" : "AND d.user_id = $1";

  const result = await pool.query(
    `
      SELECT
        a.id AS appointment_id,
        TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
        TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
        p.user_id AS patient_user_id,
        p.full_name AS patient_name,
        d.user_id AS dentist_user_id,
        d.full_name AS dentist_name
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      LEFT JOIN dentists d ON d.id = a.dentist_id
      WHERE a.status = 'Confirmed'
        AND (a.appointment_date::timestamp + a.appointment_time) >= CURRENT_TIMESTAMP
        AND (a.appointment_date::timestamp + a.appointment_time) <= CURRENT_TIMESTAMP + INTERVAL '24 hours'
        ${roleFilter}
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
      LIMIT 50
    `,
    [user.id],
  );

  const notifications = result.rows.map((appointment) => {
    const scheduleFingerprint = `${appointment.appointment_date}-${formatTime(
      appointment.appointment_time,
    )}`;

    if (user.role === "customer") {
      return buildNotification({
        userId: user.id,
        type: "APPOINTMENT_REMINDER",
        title: "Bạn có lịch khám sắp tới",
        message: `Bạn có lịch khám vào ngày ${formatDate(
          appointment.appointment_date,
        )} lúc ${formatTime(appointment.appointment_time)}${
          appointment.dentist_name ? ` với ${appointment.dentist_name}` : ""
        }.`,
        relatedEntityType: "appointment",
        relatedEntityId: appointment.appointment_id,
        actionUrl: "/my-appointments",
        dedupeKey: `appointment-reminder-24h-${appointment.appointment_id}-${scheduleFingerprint}-user-${user.id}`,
      });
    }

    return buildNotification({
      userId: user.id,
      type: "APPOINTMENT_REMINDER",
      title: "Bạn có lịch khám sắp tới",
      message: `Khách ${appointment.patient_name} có lịch khám vào ngày ${formatDate(
        appointment.appointment_date,
      )} lúc ${formatTime(appointment.appointment_time)}.`,
      relatedEntityType: "appointment",
      relatedEntityId: appointment.appointment_id,
      actionUrl: "/dentist/appointments",
      dedupeKey: `appointment-reminder-24h-${appointment.appointment_id}-${scheduleFingerprint}-user-${user.id}`,
    });
  });

  return createSafeNotifications(notifications);
};

// tao link mo form tai kham cho admin
const getReExamActionUrl = (record) => {
  const params = new URLSearchParams({
    mode: "create",
    patient_id: String(record.patient_id),
    appointment_date: record.re_examination_date,
    note: `Tái khám theo bệnh án #${record.record_id}`,
    medical_record_id: String(record.record_id),
  });

  if (record.dentist_id) params.set("dentist_id", String(record.dentist_id));
  if (record.service_id) params.set("service_id", String(record.service_id));

  return `/admin/appointments?${params.toString()}`;
};

// chon loai thong bao tai kham
const getReExamMeta = (record, user) => {
  const dateText = formatDate(record.re_examination_date);
  const isCustomer = user.role === "customer";

  if (Number(record.days_until) === 3) {
    return {
      type: "REEXAM_UPCOMING",
      title: isCustomer
        ? "Sắp đến ngày tái khám"
        : "Khách sắp đến ngày tái khám",
      message: isCustomer
        ? `Bạn có ngày tái khám dự kiến vào ${dateText}. Vui lòng đặt lịch phù hợp trước khi đến.`
        : `Khách ${record.patient_name} có ngày tái khám dự kiến vào ${dateText}.`,
      dedupePrefix: "reexam-upcoming",
    };
  }

  if (Number(record.days_until) === 0) {
    return {
      type: "REEXAM_DUE",
      title: isCustomer
        ? "Hôm nay là ngày tái khám dự kiến"
        : "Khách đến ngày tái khám",
      message: isCustomer
        ? "Hôm nay là ngày tái khám dự kiến của bạn."
        : `Khách ${record.patient_name} có ngày tái khám dự kiến hôm nay.`,
      dedupePrefix: "reexam-due",
    };
  }

  if (Number(record.days_until) < 0) {
    return {
      type: "REEXAM_OVERDUE",
      title: isCustomer
        ? "Bạn đã quá ngày tái khám dự kiến"
        : "Khách đã quá ngày tái khám",
      message: isCustomer
        ? `Bạn chưa có lịch hẹn mới sau ngày tái khám dự kiến ${dateText}.`
        : `Khách ${record.patient_name} đã quá ngày tái khám dự kiến nhưng chưa có lịch hẹn mới.`,
      dedupePrefix: "reexam-overdue",
    };
  }

  return null;
};

// nhac tai kham sap toi den han qua han
const refreshReExamNotifications = async (user) => {
  if (!["admin", "customer"].includes(user.role)) return [];

  const roleFilter =
    user.role === "customer" ? "AND p.user_id = $1" : "AND $1::integer IS NOT NULL";

  const result = await pool.query(
    `
      SELECT
        mr.id AS record_id,
        mr.patient_id,
        mr.dentist_id,
        TO_CHAR(mr.re_examination_date, 'YYYY-MM-DD') AS re_examination_date,
        (mr.re_examination_date - CURRENT_DATE)::integer AS days_until,
        p.user_id AS patient_user_id,
        p.full_name AS patient_name,
        a.service_id
      FROM medical_records mr
      JOIN patients p ON p.id = mr.patient_id
      LEFT JOIN appointments a ON a.id = mr.appointment_id
      WHERE mr.status = 'Confirmed'
        AND mr.re_examination_date IS NOT NULL
        AND mr.re_examination_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '3 days'
        AND (
          mr.re_examination_date = CURRENT_DATE + INTERVAL '3 days'
          OR mr.re_examination_date <= CURRENT_DATE
        )
        AND NOT EXISTS (
          SELECT 1
          FROM appointments next_a
          WHERE next_a.patient_id = mr.patient_id
            AND next_a.status <> 'Cancelled'
            AND next_a.id <> COALESCE(mr.appointment_id, 0)
            AND (
              next_a.created_at >= mr.created_at
              OR next_a.appointment_date >= mr.re_examination_date
            )
        )
        ${roleFilter}
      ORDER BY mr.re_examination_date ASC, mr.id ASC
      LIMIT 50
    `,
    [user.id],
  );

  const notifications = result.rows
    .map((record) => {
      const meta = getReExamMeta(record, user);
      if (!meta) return null;

      return buildNotification({
        userId: user.id,
        type: meta.type,
        title: meta.title,
        message: meta.message,
        relatedEntityType: "medical_record",
        relatedEntityId: record.record_id,
        actionUrl:
          user.role === "admin"
            ? getReExamActionUrl(record)
            : `/medical-results?record_id=${record.record_id}`,
        dedupeKey: `${meta.dedupePrefix}-${record.record_id}-user-${user.id}`,
      });
    })
    .filter(Boolean);

  return createSafeNotifications(notifications);
};

// refresh thong bao cho user dang dang nhap
const refreshNotificationsForUser = async (user) => {
  if (!user?.id || !user.role) return [];

  const results = await Promise.all([
    refreshMissingMedicalRecordNotifications(user),
    refreshAppointmentReminders(user),
    refreshReExamNotifications(user),
  ]);

  return results.flat();
};

module.exports = {
  refreshNotificationsForUser,
  refreshMissingMedicalRecordNotifications,
  refreshAppointmentReminders,
  refreshReExamNotifications,
};
