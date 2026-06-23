const pool = require("../config/db");

const getAppointmentHistoryByPatientId = async (patientId) => {
  const query = `
    SELECT
      a.id,
      a.patient_id,
      a.dentist_id,
      a.service_id,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.appointment_time,
      a.status,
      a.note,
      a.clinic_note,
      d.full_name AS dentist_name,
      s.service_name
    FROM appointments a
    LEFT JOIN dentists d ON a.dentist_id = d.id
    JOIN services s ON a.service_id = s.id
    WHERE a.patient_id = $1
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  const result = await pool.query(query, [patientId]);
  return result.rows;
};

const createAppointment = async (appointmentData) => {
  const {
    patient_id,
    dentist_id,
    service_id,
    appointment_date,
    appointment_time,
    status,
    note,
  } = appointmentData;

  const query = `
    INSERT INTO appointments (
      patient_id,
      dentist_id,
      service_id,
      appointment_date,
      appointment_time,
      status,
      note
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      patient_id,
      dentist_id,
      service_id,
      TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
      appointment_time,
      status,
      note,
      created_at
  `;

  const values = [
    patient_id,
    dentist_id || null,
    service_id,
    appointment_date,
    appointment_time,
    status || "Pending",
    note || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const checkAppointmentReferences = async (
  patientId,
  dentistId,
  serviceId,
) => {
  const patientQuery = "SELECT id FROM patients WHERE id = $1";
  const serviceQuery = "SELECT id FROM services WHERE id = $1";

  const patientResult = await pool.query(patientQuery, [patientId]);
  const serviceResult = await pool.query(serviceQuery, [serviceId]);

  let dentistExists = true;

  if (dentistId) {
    const dentistQuery = "SELECT id FROM dentists WHERE id = $1";
    const dentistResult = await pool.query(dentistQuery, [dentistId]);
    dentistExists = dentistResult.rows.length > 0;
  }

  return {
    patientExists: patientResult.rows.length > 0,
    dentistExists,
    serviceExists: serviceResult.rows.length > 0,
  };
};

const checkDentistAppointmentConflict = async (
  dentistId,
  appointmentDate,
  appointmentTime,
) => {
  if (!dentistId) {
    return false;
  }

  const query = `
    SELECT id
    FROM appointments
    WHERE dentist_id = $1
      AND appointment_date = $2
      AND appointment_time = $3
      AND status IN ('Pending', 'Confirmed')
  `;

  const result = await pool.query(query, [
    dentistId,
    appointmentDate,
    appointmentTime,
  ]);

  return result.rows.length > 0;
};

const cancelAppointmentById = async (appointmentId, patientId) => {
  const query = `
    UPDATE appointments
    SET status = 'Cancelled'
    WHERE id = $1
      AND patient_id = $2
      AND status IN ('Pending', 'Confirmed')
    RETURNING
      id,
      patient_id,
      dentist_id,
      service_id,
      TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
      appointment_time,
      status,
      note,
      created_at
  `;

  const result = await pool.query(query, [appointmentId, patientId]);
  return result.rows[0];
};

const getAllAppointments = async () => {
  const query = `
    SELECT
      a.id,
      a.patient_id,
      a.dentist_id,
      a.service_id,
      TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
      a.appointment_time,
      a.status,
      a.note,
      a.clinic_note,
      p.full_name AS patient_name,
      p.phone AS patient_phone,
      d.full_name AS dentist_name,
      s.service_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN dentists d ON a.dentist_id = d.id
    JOIN services s ON a.service_id = s.id
    ORDER BY a.appointment_date DESC, a.appointment_time DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const findAppointmentById = async (appointmentId) => {
  const query = `
    SELECT
      id,
      patient_id,
      service_id,
      appointment_date,
      appointment_time,
      status
    FROM appointments
    WHERE id = $1
  `;

  const result = await pool.query(query, [appointmentId]);
  return result.rows[0];
};

const checkAppointmentConflictForUpdate = async (
  dentistId,
  appointmentDate,
  appointmentTime,
  appointmentId,
) => {
  if (!dentistId) {
    return false;
  }

  const query = `
    SELECT id
    FROM appointments
    WHERE dentist_id = $1
      AND appointment_date = $2
      AND appointment_time = $3
      AND id <> $4
      AND status IN ('Pending', 'Confirmed')
  `;

  const result = await pool.query(query, [
    dentistId,
    appointmentDate,
    appointmentTime,
    appointmentId,
  ]);

  return result.rows.length > 0;
};

const updateAppointmentByAdmin = async (
  appointmentId,
  dentistId,
  status,
  clinicNote,
) => {
  const query = `
    UPDATE appointments
    SET
      dentist_id = $2,
      status = $3,
      clinic_note = $4
    WHERE id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [
    appointmentId,
    dentistId,
    status,
    clinicNote || null,
  ]);

  return result.rows[0];
};

module.exports = {
  getAppointmentHistoryByPatientId,
  createAppointment,
  checkAppointmentReferences,
  checkDentistAppointmentConflict,
  cancelAppointmentById,
  getAllAppointments,
  findAppointmentById,
  checkAppointmentConflictForUpdate,
  updateAppointmentByAdmin,
};