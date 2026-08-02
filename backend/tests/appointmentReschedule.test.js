const test = require("node:test");
const assert = require("node:assert/strict");

const appointmentModel = require("../src/models/appointmentModel");
const dentistModel = require("../src/models/dentistModel");
const unavailableModel = require("../src/models/dentistUnavailableModel");
const notificationService = require("../src/services/appointmentNotificationService");

const originalCheckAppointmentConflictForUpdate =
  appointmentModel.checkAppointmentConflictForUpdate;
const originalUpdateAppointmentByAdmin =
  appointmentModel.updateAppointmentByAdmin;

let currentAppointment;
let hasConflict;
let isUnavailable;
let updateCalls;
let notificationCalls;

const baseAppointment = {
  id: 42,
  patient_id: 9,
  patient_user_id: 20,
  patient_name: "Nguyễn Văn A",
  patient_phone: "0900000000",
  dentist_id: 7,
  dentist_user_id: 30,
  dentist_name: "Bsi. Trần Văn B",
  service_id: 5,
  service_name: "Cạo vôi, đánh bóng",
  appointment_date: "2026-08-04",
  appointment_time: "09:00",
  status: "Pending",
  clinic_note: null,
};

appointmentModel.getAppointmentDetailsById = async () => ({
  ...currentAppointment,
});
appointmentModel.withAppointmentSlotLock = async (date, time, callback) =>
  callback({ slot: `${date}-${time}` });
appointmentModel.checkAppointmentReferences = async () => ({
  patientExists: true,
  dentistExists: true,
  serviceExists: true,
});
appointmentModel.checkAppointmentConflictForUpdate = async (
  dentistId,
  date,
  time,
  appointmentId,
) => {
  assert.equal(Number(appointmentId), 42);
  return hasConflict;
};
appointmentModel.updateAppointmentByAdmin = async (
  appointmentId,
  date,
  time,
  dentistId,
  status,
  clinicNote,
) => {
  updateCalls.push({
    appointmentId,
    date,
    time,
    dentistId,
    status,
    clinicNote,
  });
  currentAppointment = {
    ...currentAppointment,
    appointment_date: date,
    appointment_time: time,
    dentist_id: dentistId,
    status,
    clinic_note: clinicNote,
  };
  return currentAppointment;
};
dentistModel.findDentistById = async () => ({
  id: 7,
  is_active: true,
  user_is_active: true,
});
unavailableModel.checkDentistUnavailableConflict = async () => isUnavailable;
notificationService.notifyAppointmentTransition = async (before, after) => {
  notificationCalls.push({ before, after });
  return [];
};

delete require.cache[require.resolve("../src/controllers/appointmentController")];
const {
  manageAppointment,
} = require("../src/controllers/appointmentController");

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return response;
};

const runManage = async (body) => {
  const response = createResponse();
  await manageAppointment(
    {
      params: { appointmentId: "42" },
      body,
      user: { id: 1, role: "admin" },
    },
    response,
  );
  return response;
};

test.beforeEach(() => {
  currentAppointment = { ...baseAppointment };
  hasConflict = false;
  isUnavailable = false;
  updateCalls = [];
  notificationCalls = [];
});

test("admin can move an active appointment to a valid future slot", async () => {
  const response = await runManage({
    appointment_date: "2026-08-05",
    appointment_time: "14:00",
    dentist_id: 7,
    status: "Pending",
    clinic_note: "Khách đã đồng ý đổi lịch.",
  });

  assert.equal(response.statusCode, 200, JSON.stringify(response.body));
  assert.equal(updateCalls.length, 1);
  assert.deepEqual(
    [updateCalls[0].date, updateCalls[0].time],
    ["2026-08-05", "14:00"],
  );
  assert.equal(notificationCalls.length, 1);
});

test("conflicting dentist slot is rejected without any partial update", async () => {
  hasConflict = true;
  const response = await runManage({
    appointment_date: "2026-08-05",
    appointment_time: "14:00",
    dentist_id: 7,
    status: "Pending",
    clinic_note: "",
    force_assign: true,
  });

  assert.equal(response.statusCode, 409, JSON.stringify(response.body));
  assert.equal(response.body.code, "DENTIST_HAS_APPOINTMENT");
  assert.equal(
    response.body.message,
    "Nha sĩ đã có lịch hẹn vào thời gian này. Vui lòng chọn giờ khác hoặc phân công nha sĩ khác.",
  );
  assert.equal(updateCalls.length, 0);
  assert.equal(notificationCalls.length, 0);
});

test("completed and cancelled appointments cannot be rescheduled", async () => {
  for (const status of ["Completed", "Cancelled"]) {
    currentAppointment = { ...baseAppointment, status };
    const response = await runManage({
      appointment_date: "2026-08-05",
      appointment_time: "14:00",
      dentist_id: 7,
      status: status === "Completed" ? "Pending" : "Cancelled",
      clinic_note: "",
    });

    assert.equal(response.statusCode, 409);
    assert.equal(response.body.code, "APPOINTMENT_LOCKED");
  }

  assert.equal(updateCalls.length, 0);
});

test("invalid, closed and off-hours schedule values are rejected", async () => {
  const cases = [
    ["2026-02-31", "14:00"],
    ["2026-08-03", "14:00"],
    ["2026-08-05", "12:30"],
    ["2026-08-05", "14:10"],
  ];

  for (const [date, time] of cases) {
    currentAppointment = { ...baseAppointment };
    const response = await runManage({
      appointment_date: date,
      appointment_time: time,
      dentist_id: 7,
      status: "Pending",
      clinic_note: "",
    });
    assert.equal(response.statusCode, 400);
  }

  assert.equal(updateCalls.length, 0);
});

test("update query carries date and time and conflict query excludes itself", async () => {
  const calls = [];
  const db = {
    query: async (query, values) => {
      calls.push({ query, values });
      return { rows: query.startsWith("\n    SELECT") ? [] : [{ id: 42 }] };
    },
  };

  await originalCheckAppointmentConflictForUpdate(
    7,
    "2026-08-05",
    "14:00",
    42,
    db,
  );
  await originalUpdateAppointmentByAdmin(
    42,
    "2026-08-05",
    "14:00",
    7,
    "Pending",
    "Đổi theo yêu cầu khách.",
    db,
  );

  assert.match(calls[0].query, /id <> \$4/);
  assert.deepEqual(calls[0].values, [7, "2026-08-05", "14:00", 42]);
  assert.match(calls[1].query, /appointment_date = \$2/);
  assert.match(calls[1].query, /appointment_time = \$3/);
  assert.deepEqual(calls[1].values.slice(0, 4), [
    42,
    "2026-08-05",
    "14:00",
    7,
  ]);
});
