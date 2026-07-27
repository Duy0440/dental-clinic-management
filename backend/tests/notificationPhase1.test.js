const test = require("node:test");
const assert = require("node:assert/strict");

const pool = require("../src/config/db");
const notificationModel = require("../src/models/notificationModel");

const originalPoolQuery = pool.query;
const originalCreateNotification = notificationModel.createNotification;
const capturedNotifications = [];

pool.query = async (query) => {
  if (query.includes("FROM users")) {
    return { rows: [{ id: 1 }, { id: 2 }] };
  }

  throw new Error("Unexpected pool query in notification test");
};

notificationModel.createNotification = async (notification) => {
  capturedNotifications.push(notification);
  return notification;
};

const {
  notifyAppointmentCreated,
  notifyAppointmentCancelled,
  notifyAppointmentTransition,
} = require("../src/services/appointmentNotificationService");

const appointment = {
  id: 42,
  patient_id: 9,
  patient_user_id: 20,
  patient_name: "Nguyễn Văn A",
  dentist_id: 7,
  dentist_user_id: 30,
  dentist_name: "Bsi. Trần Văn B",
  service_id: 5,
  service_name: "Cạo vôi, đánh bóng",
  appointment_date: "2026-07-30",
  appointment_time: "10:00",
  status: "Pending",
};

test.after(() => {
  pool.query = originalPoolQuery;
  notificationModel.createNotification = originalCreateNotification;
});

test.beforeEach(() => {
  capturedNotifications.length = 0;
});

test("guest booking notifies admins but never creates a customer notification", async () => {
  await notifyAppointmentCreated(appointment, { notifyCustomer: false });

  assert.equal(capturedNotifications.length, 2);
  assert.ok(
    capturedNotifications.every(
      (item) => item.type === "APPOINTMENT_REQUEST_CREATED",
    ),
  );
  assert.deepEqual(
    capturedNotifications.map((item) => item.user_id),
    [1, 2],
  );
});

test("authenticated customer booking notifies admins and the exact customer", async () => {
  await notifyAppointmentCreated(appointment, { notifyCustomer: true });

  const customerNotification = capturedNotifications.find(
    (item) => item.type === "APPOINTMENT_REQUEST_SUBMITTED",
  );

  assert.equal(capturedNotifications.length, 3);
  assert.equal(customerNotification.user_id, appointment.patient_user_id);
  assert.equal(
    customerNotification.dedupe_key,
    "appointment-submitted-42-customer-20",
  );
});

test("confirmation notifies only the customer and assigned dentist", async () => {
  await notifyAppointmentTransition(appointment, {
    ...appointment,
    status: "Confirmed",
  });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["APPOINTMENT_CONFIRMED", 20],
      ["DENTIST_APPOINTMENT_ASSIGNED", 30],
    ],
  );
});

test("same update creates nothing and dentist change uses a stable dedupe key", async () => {
  await notifyAppointmentTransition(appointment, { ...appointment });
  assert.equal(capturedNotifications.length, 0);

  const reassigned = {
    ...appointment,
    dentist_id: 8,
    dentist_user_id: 31,
    dentist_name: "Bsi. Lê Văn C",
  };

  await notifyAppointmentTransition(appointment, reassigned);
  const firstKeys = capturedNotifications.map((item) => item.dedupe_key);

  capturedNotifications.length = 0;
  await notifyAppointmentTransition(appointment, reassigned);

  assert.deepEqual(
    capturedNotifications.map((item) => item.dedupe_key),
    firstKeys,
  );
  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["APPOINTMENT_UPDATED", 20],
      ["DENTIST_APPOINTMENT_ASSIGNED", 31],
    ],
  );

  capturedNotifications.length = 0;
  await notifyAppointmentTransition(appointment, {
    ...appointment,
    appointment_date: "2026-08-01",
    appointment_time: "11:30",
  });

  assert.equal(capturedNotifications.length, 1);
  assert.equal(capturedNotifications[0].type, "APPOINTMENT_UPDATED");
  assert.match(capturedNotifications[0].message, /01\/08\/2026/);
  assert.match(capturedNotifications[0].message, /11:30/);
});

test("cancellation notifies customer and currently assigned dentist", async () => {
  await notifyAppointmentCancelled({
    ...appointment,
    status: "Cancelled",
  });

  assert.deepEqual(
    capturedNotifications.map((item) => [item.type, item.user_id]),
    [
      ["APPOINTMENT_CANCELLED", 20],
      ["APPOINTMENT_CANCELLED", 30],
    ],
  );
});

test("notification model scopes list and read updates to the authenticated user", async () => {
  const calls = [];
  const db = {
    query: async (query, values) => {
      calls.push({ query, values });
      return {
        rows: query.includes("COUNT")
          ? [{ unread_count: 4 }]
          : [{ id: values[0], is_read: true }],
        rowCount: 2,
      };
    },
  };

  await notificationModel.getNotificationsByUserId(77, 6, db);
  await notificationModel.getUnreadNotificationCount(77, db);
  await notificationModel.markNotificationRead(91, 77, db);
  await notificationModel.markAllNotificationsRead(77, db);

  assert.deepEqual(calls[0].values, [77, 6]);
  assert.deepEqual(calls[1].values, [77]);
  assert.deepEqual(calls[2].values, [91, 77]);
  assert.match(calls[2].query, /AND user_id = \$2/);
  assert.deepEqual(calls[3].values, [77]);
  assert.match(calls[3].query, /WHERE user_id = \$1/);
});

test("insert uses PostgreSQL conflict handling for a stable dedupe key", async () => {
  let insertCall;
  const db = {
    query: async (query, values) => {
      insertCall = { query, values };
      return { rows: [] };
    },
  };

  const result = await originalCreateNotification(
    {
      user_id: 20,
      type: "APPOINTMENT_REQUEST_SUBMITTED",
      title: "Yêu cầu đặt lịch đã được tiếp nhận",
      message: "Đang chờ xác nhận",
      related_entity_type: "appointment",
      related_entity_id: 42,
      action_url: "/my-appointments",
      dedupe_key: "appointment-submitted-42-customer-20",
    },
    db,
  );

  assert.equal(result, null);
  assert.match(insertCall.query, /ON CONFLICT \(dedupe_key\) DO NOTHING/);
  assert.equal(
    insertCall.values[7],
    "appointment-submitted-42-customer-20",
  );
});
