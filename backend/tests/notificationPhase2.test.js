const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/config/db");
const notificationModel = require("../src/models/notificationModel");

const originalPoolQuery = pool.query;
const originalCreateNotification = notificationModel.createNotification;
const capturedNotifications = [];
const dedupeKeys = new Set();
let queryHandler = async () => ({ rows: [] });

pool.query = async (query, values) => queryHandler(query, values);

notificationModel.createNotification = async (notification) => {
  if (dedupeKeys.has(notification.dedupe_key)) return null;
  dedupeKeys.add(notification.dedupe_key);
  capturedNotifications.push(notification);
  return notification;
};

const {
  notifyMedicalRecordPending,
  notifyMedicalRecordConfirmed,
} = require("../src/services/medicalRecordNotificationService");
const {
  refreshNotificationsForUser,
} = require("../src/services/notificationReminderService");

const baseRecord = {
  id: 12,
  patient_id: 4,
  patient_user_id: 20,
  patient_name: "Nguyen Van A",
  dentist_id: 7,
  dentist_user_id: 30,
  dentist_name: "Bsi. Tran Van B",
  appointment_date: "2026-08-05",
  created_at: "2026-08-02T08:00:00.000Z",
};

const appointmentReminderRow = {
  appointment_id: 51,
  appointment_date: "2026-08-03",
  appointment_time: "09:00",
  patient_user_id: 20,
  patient_name: "Nguyen Van A",
  dentist_user_id: 30,
  dentist_name: "Bsi. Tran Van B",
};

const missingAppointmentRow = {
  appointment_id: 61,
  appointment_date: "2026-08-01",
  appointment_time: "10:00",
  patient_name: "Tran Thi B",
  dentist_user_id: 30,
};

const reExamRow = {
  record_id: 71,
  patient_id: 4,
  dentist_id: 7,
  service_id: 3,
  re_examination_date: "2026-08-05",
  days_until: 3,
  patient_user_id: 20,
  patient_name: "Nguyen Van A",
};

test.after(() => {
  pool.query = originalPoolQuery;
  notificationModel.createNotification = originalCreateNotification;
});

test.beforeEach(() => {
  capturedNotifications.length = 0;
  dedupeKeys.clear();
  queryHandler = async () => ({ rows: [] });
});

test("phase2 test 1: pending medical record notifies only the responsible dentist", async () => {
  await notifyMedicalRecordPending(baseRecord);

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [["MEDICAL_RECORD_PENDING", 30]],
  );
  assert.equal(
    capturedNotifications[0].dedupe_key,
    "medical-record-pending-12-dentist-30",
  );
  assert.equal(
    capturedNotifications[0].action_url,
    "/dentist/medical-records?record_id=12",
  );
});

test("phase2 test 2: confirmed medical record notifies the linked customer", async () => {
  await notifyMedicalRecordConfirmed(baseRecord);

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [["MEDICAL_RECORD_CONFIRMED", 20]],
  );
  assert.equal(
    capturedNotifications[0].dedupe_key,
    "medical-record-confirmed-12-customer-20",
  );
  assert.equal(capturedNotifications[0].action_url, "/medical-results?record_id=12");
});

test("phase2 test 3: completed appointment without record notifies admin and avoids duplicates", async () => {
  queryHandler = async (query) => {
    if (query.includes("mr.id IS NULL")) {
      return { rows: [missingAppointmentRow] };
    }

    return { rows: [] };
  };

  await refreshNotificationsForUser({ id: 1, role: "admin" });
  await refreshNotificationsForUser({ id: 30, role: "dentist" });
  await refreshNotificationsForUser({ id: 1, role: "admin" });
  await refreshNotificationsForUser({ id: 30, role: "dentist" });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["MEDICAL_RECORD_MISSING", 1],
      ["MEDICAL_RECORD_MISSING", 30],
    ],
  );
  assert.equal(
    capturedNotifications[0].dedupe_key,
    "medical-record-missing-61-user-1",
  );
  assert.equal(
    capturedNotifications[1].dedupe_key,
    "medical-record-missing-61-user-30",
  );
});

test("phase2 test 4: appointment reminder goes to customer and dentist, not a guest", async () => {
  queryHandler = async (query) =>
    query.includes("a.status = 'Confirmed'")
      ? { rows: [appointmentReminderRow] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 20, role: "customer" });
  await refreshNotificationsForUser({ id: 30, role: "dentist" });
  await refreshNotificationsForUser(null);

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["APPOINTMENT_REMINDER", 20],
      ["APPOINTMENT_REMINDER", 30],
    ],
  );
});

test("phase2 test 5: re-exam upcoming notifies customer and admin", async () => {
  queryHandler = async (query) =>
    query.includes("FROM medical_records mr")
      ? { rows: [reExamRow] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 20, role: "customer" });
  await refreshNotificationsForUser({ id: 1, role: "admin" });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["REEXAM_UPCOMING", 20],
      ["REEXAM_UPCOMING", 1],
    ],
  );
});

test("phase2 test 6: re-exam due notifies customer and admin", async () => {
  queryHandler = async (query) =>
    query.includes("FROM medical_records mr")
      ? { rows: [{ ...reExamRow, days_until: 0 }] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 20, role: "customer" });
  await refreshNotificationsForUser({ id: 1, role: "admin" });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["REEXAM_DUE", 20],
      ["REEXAM_DUE", 1],
    ],
  );
});

test("phase2 test 7: overdue re-exam notifies admin", async () => {
  queryHandler = async (query) =>
    query.includes("FROM medical_records mr")
      ? { rows: [{ ...reExamRow, days_until: -2 }] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 1, role: "admin" });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [["REEXAM_OVERDUE", 1]],
  );
});

test("phase2 test 8: existing re-exam appointment means no re-exam notification", async () => {
  queryHandler = async () => ({ rows: [] });

  await refreshNotificationsForUser({ id: 1, role: "admin" });
  await refreshNotificationsForUser({ id: 20, role: "customer" });

  assert.equal(capturedNotifications.length, 0);
});

test("phase2 test 9: admin re-exam action url opens appointment creation with prefill data", async () => {
  queryHandler = async (query) =>
    query.includes("FROM medical_records mr")
      ? { rows: [reExamRow] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 1, role: "admin" });

  const actionUrl = capturedNotifications[0].action_url;
  assert.match(actionUrl, /^\/admin\/appointments\?/);
  assert.match(actionUrl, /mode=create/);
  assert.match(actionUrl, /patient_id=4/);
  assert.match(actionUrl, /dentist_id=7/);
  assert.match(actionUrl, /appointment_date=2026-08-05/);
  assert.match(actionUrl, /service_id=3/);
  assert.match(actionUrl, /medical_record_id=71/);
});

test("phase2 test 10: reminder refresh scopes notifications to current user", async () => {
  queryHandler = async (query, values) => {
    assert.equal(values[0], 30);
    return query.includes("a.status = 'Confirmed'")
      ? { rows: [appointmentReminderRow] }
      : { rows: [] };
  };

  await refreshNotificationsForUser({ id: 30, role: "dentist" });

  assert.deepEqual(
    capturedNotifications.map((item) => item.user_id),
    [30],
  );
});

test("phase2 test 11: repeated refresh does not create duplicate notifications", async () => {
  queryHandler = async (query) =>
    query.includes("a.status = 'Confirmed'")
      ? { rows: [appointmentReminderRow] }
      : { rows: [] };

  await refreshNotificationsForUser({ id: 20, role: "customer" });
  await refreshNotificationsForUser({ id: 20, role: "customer" });

  assert.equal(capturedNotifications.length, 1);
  assert.equal(capturedNotifications[0].type, "APPOINTMENT_REMINDER");
});
