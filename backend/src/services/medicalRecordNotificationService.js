// gui thong bao benh an
const { createNotification } = require("../models/notificationModel");

const formatDate = (value) => {
  if (!value) return "";

  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : String(value);
};

const createSafeNotifications = async (notifications) => {
  if (!notifications.length) return [];

  const results = await Promise.allSettled(
    notifications.map((notification) => createNotification(notification)),
  );
  const failedCount = results.filter(
    (result) => result.status === "rejected",
  ).length;

  if (failedCount > 0) {
    throw new Error(`Failed to create ${failedCount} medical record notifications`);
  }

  return results.map((result) => result.value).filter(Boolean);
};

const buildNotification = ({
  userId,
  type,
  title,
  message,
  actionUrl,
  recordId,
  dedupeKey,
}) => ({
  user_id: userId,
  type,
  title,
  message,
  related_entity_type: "medical_record",
  related_entity_id: recordId,
  action_url: actionUrl,
  dedupe_key: dedupeKey,
});

// gui thong bao cho nha si xac nhan benh an
const notifyMedicalRecordPending = async (record) => {
  if (!record?.id || !record.dentist_user_id) return [];

  return createSafeNotifications([
    buildNotification({
      userId: record.dentist_user_id,
      type: "MEDICAL_RECORD_PENDING",
      title: "Có bệnh án chờ xác nhận",
      message: `Bệnh án của khách ${record.patient_name} đang chờ bạn kiểm tra và xác nhận.`,
      actionUrl: `/dentist/medical-records?record_id=${record.id}`,
      recordId: record.id,
      dedupeKey: `medical-record-pending-${record.id}-dentist-${record.dentist_user_id}`,
    }),
  ]);
};

// gui thong bao ket qua kham cho khach
const notifyMedicalRecordConfirmed = async (record) => {
  if (!record?.id || !record.patient_user_id) return [];

  return createSafeNotifications([
    buildNotification({
      userId: record.patient_user_id,
      type: "MEDICAL_RECORD_CONFIRMED",
      title: "Kết quả khám đã được xác nhận",
      message: `Nha sĩ đã xác nhận kết quả khám ngày ${formatDate(
        record.appointment_date || record.created_at,
      )} của bạn.`,
      actionUrl: `/medical-results?record_id=${record.id}`,
      recordId: record.id,
      dedupeKey: `medical-record-confirmed-${record.id}-customer-${record.patient_user_id}`,
    }),
  ]);
};

module.exports = {
  notifyMedicalRecordPending,
  notifyMedicalRecordConfirmed,
};
