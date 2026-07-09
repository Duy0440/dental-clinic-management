const pool = require("../config/db");

const getAllMedicalRecords = async () => {
  const query = `
    SELECT
      mr.id,
      mr.appointment_id,
      mr.patient_id,
      mr.dentist_id,
      mr.diagnosis,
      mr.treatment,
      mr.note,
      TO_CHAR(
        mr.re_examination_date,
        'YYYY-MM-DD'
      ) AS re_examination_date,
      TO_CHAR(
        mr.re_examination_date,
        'DD/MM/YYYY'
      ) AS re_examination_date_display,
      mr.re_examination_time,
      mr.attachment_url,
      mr.entered_by_user_id,
      mr.created_at,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', mra.id,
              'file_name', mra.file_name,
              'file_url', mra.file_url,
              'file_type', mra.file_type,
              'created_at', mra.created_at
            )
          )
          FROM medical_record_attachments mra
          WHERE mra.medical_record_id = mr.id
        ),
        '[]'::json
      ) AS attachments,
      p.full_name AS patient_name,
      d.full_name AS dentist_name,
      u.username AS entered_by_username
    FROM medical_records mr
    JOIN patients p ON mr.patient_id = p.id
    JOIN dentists d ON mr.dentist_id = d.id
    LEFT JOIN users u ON mr.entered_by_user_id = u.id
    ORDER BY mr.id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const getMedicalRecordsByPatientId = async (patientId) => {
  const query = `
    SELECT
      mr.id,
      mr.appointment_id,
      mr.patient_id,
      mr.dentist_id,
      mr.diagnosis,
      mr.treatment,
      mr.note,
      TO_CHAR(
        mr.re_examination_date,
        'YYYY-MM-DD'
      ) AS re_examination_date,
      TO_CHAR(
        mr.re_examination_date,
        'DD/MM/YYYY'
      ) AS re_examination_date_display,
      mr.re_examination_time,
      mr.attachment_url,
      mr.entered_by_user_id,
      mr.created_at,

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', mra.id,
              'file_name', mra.file_name,
              'file_url', mra.file_url,
              'file_type', mra.file_type,
              'created_at', mra.created_at
            )
          )
          FROM medical_record_attachments mra
          WHERE mra.medical_record_id = mr.id
        ),
        '[]'::json
      ) AS attachments,
      d.full_name AS dentist_name,
      u.username AS entered_by_username
    FROM medical_records mr
    JOIN dentists d ON mr.dentist_id = d.id
    LEFT JOIN users u ON mr.entered_by_user_id = u.id
    WHERE mr.patient_id = $1
    ORDER BY mr.id DESC
  `;

  const result = await pool.query(query, [patientId]);
  return result.rows;
};

const createMedicalRecord = async (recordData) => {
  const {
    appointment_id,
    patient_id,
    dentist_id,
    diagnosis,
    treatment,
    note,
    re_examination_date,
    re_examination_time,
    attachment_url,
    entered_by_user_id,
  } = recordData;

  const query = `
    INSERT INTO medical_records (
      appointment_id,
      patient_id,
      dentist_id,
      diagnosis,
      treatment,
      note,
      re_examination_date,
      re_examination_time,
      attachment_url,
      entered_by_user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id,
      appointment_id,
      patient_id,
      dentist_id,
      diagnosis,
      treatment,
      note,
      TO_CHAR(
        re_examination_date,
        'YYYY-MM-DD'
      ) AS re_examination_date,
      TO_CHAR(
        re_examination_date,
        'DD/MM/YYYY'
      ) AS re_examination_date_display,
      re_examination_time,
      attachment_url,
      entered_by_user_id,
      created_at
  `;

  const values = [
    appointment_id || null,
    patient_id,
    dentist_id,
    diagnosis || null,
    treatment || null,
    note || null,
    re_examination_date || null,
    re_examination_time || null,
    attachment_url || null,
    entered_by_user_id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const checkMedicalRecordReferences = async (
  patientId,
  dentistId,
  appointmentId,
) => {
  const patientQuery = `
    SELECT id
    FROM patients
    WHERE id = $1
  `;

  const dentistQuery = `
    SELECT id
    FROM dentists
    WHERE id = $1
  `;

  const patientResult = await pool.query(patientQuery, [patientId]);
  const dentistResult = await pool.query(dentistQuery, [dentistId]);

  let appointmentExists = true;

  if (appointmentId) {
    const appointmentQuery = `
      SELECT id
      FROM appointments
      WHERE id = $1
        AND patient_id = $2
    `;

    const appointmentResult = await pool.query(appointmentQuery, [
      appointmentId,
      patientId,
    ]);

    appointmentExists = appointmentResult.rows.length > 0;
  }

  return {
    patientExists: patientResult.rows.length > 0,
    dentistExists: dentistResult.rows.length > 0,
    appointmentExists,
  };
};

const findMedicalRecordByAppointmentId = async (appointmentId) => {
  if (!appointmentId) {
    return null;
  }

  const query = `
    SELECT id
    FROM medical_records
    WHERE appointment_id = $1
  `;

  const result = await pool.query(query, [appointmentId]);
  return result.rows[0];
};

const checkReExaminationConflict = async (
  dentistId,
  reExaminationDate,
  reExaminationTime,
) => {
  if (!dentistId || !reExaminationDate || !reExaminationTime) {
    return false;
  }

  const query = `
    SELECT id
    FROM medical_records
    WHERE dentist_id = $1
      AND re_examination_date = $2
      AND re_examination_time = $3
  `;

  const result = await pool.query(query, [
    dentistId,
    reExaminationDate,
    reExaminationTime,
  ]);

  return result.rows.length > 0;
};

module.exports = {
  getAllMedicalRecords,
  getMedicalRecordsByPatientId,
  createMedicalRecord,
  checkMedicalRecordReferences,
  findMedicalRecordByAppointmentId,
  checkReExaminationConflict,
};
