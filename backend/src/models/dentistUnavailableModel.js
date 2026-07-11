const pool = require("../config/db");

const getUnavailableTimesByDentistId = async (dentistId) => {
  const query = `
    SELECT
      id,
      dentist_id,
      TO_CHAR(unavailable_date, 'YYYY-MM-DD') AS unavailable_date,
      TO_CHAR(unavailable_date, 'DD/MM/YYYY') AS unavailable_date_display,
      start_time,
      end_time,
      reason,
      created_by_user_id,
      created_at
    FROM dentist_unavailable_times
    WHERE dentist_id = $1
    ORDER BY unavailable_date DESC, start_time ASC
  `;

  const result = await pool.query(query, [dentistId]);
  return result.rows;
};

const getRecentUnavailableTimes = async (limit = 5) => {
  const query = `
    SELECT
      dut.id,
      dut.dentist_id,
      d.full_name AS dentist_name,
      d.specialty,
      TO_CHAR(dut.unavailable_date, 'YYYY-MM-DD') AS unavailable_date,
      TO_CHAR(dut.unavailable_date, 'DD/MM/YYYY') AS unavailable_date_display,
      dut.start_time,
      dut.end_time,
      dut.reason,
      dut.created_at
    FROM dentist_unavailable_times dut
    JOIN dentists d ON dut.dentist_id = d.id
    ORDER BY dut.created_at DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
};

const createUnavailableTime = async (data) => {
  const {
    dentist_id,
    unavailable_date,
    start_time,
    end_time,
    reason,
    created_by_user_id,
  } = data;

  const query = `
    INSERT INTO dentist_unavailable_times (
      dentist_id,
      unavailable_date,
      start_time,
      end_time,
      reason,
      created_by_user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      dentist_id,
      TO_CHAR(unavailable_date, 'YYYY-MM-DD') AS unavailable_date,
      TO_CHAR(unavailable_date, 'DD/MM/YYYY') AS unavailable_date_display,
      start_time,
      end_time,
      reason,
      created_by_user_id,
      created_at
  `;

  const values = [
    dentist_id,
    unavailable_date,
    start_time || null,
    end_time || null,
    reason || null,
    created_by_user_id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const checkDentistUnavailableConflict = async (
  dentistId,
  appointmentDate,
  appointmentTime,
) => {
  if (!dentistId) {
    return false;
  }

  const query = `
    SELECT id
    FROM dentist_unavailable_times
    WHERE dentist_id = $1
      AND unavailable_date = $2
      AND (
        (start_time IS NULL AND end_time IS NULL)
        OR
        ($3::time >= start_time AND $3::time < end_time)
      )
    LIMIT 1
  `;

  const result = await pool.query(query, [
    dentistId,
    appointmentDate,
    appointmentTime,
  ]);

  return result.rows.length > 0;
};

module.exports = {
  getUnavailableTimesByDentistId,
  getRecentUnavailableTimes,
  createUnavailableTime,
  checkDentistUnavailableConflict,
};
