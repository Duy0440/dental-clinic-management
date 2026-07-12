const pool = require("../config/db");

// review list (lay tat ca danh gia)
const getAllReviews = async () => {
  const query = `
    SELECT
      r.id,
      r.patient_id,
      r.service_id,
      r.rating,
      r.comment,
      r.created_at,
      p.full_name AS patient_name,
      s.service_name
    FROM reviews r
    JOIN patients p ON r.patient_id = p.id
    JOIN services s ON r.service_id = s.id
    ORDER BY r.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// patient reviews (lay danh gia cua khach)
const getReviewsByPatientId = async (patientId) => {
  const query = `
    SELECT
      r.id,
      r.patient_id,
      r.service_id,
      r.rating,
      r.comment,
      r.created_at,
      s.service_name
    FROM reviews r
    JOIN services s ON r.service_id = s.id
    WHERE r.patient_id = $1
    ORDER BY r.created_at DESC
  `;

  const result = await pool.query(query, [patientId]);
  return result.rows;
};

// duplicate check (kiem tra da danh gia chua)
const findExistingReview = async (patientId, serviceId) => {
  const query = `
    SELECT id
    FROM reviews
    WHERE patient_id = $1
      AND service_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [patientId, serviceId]);
  return result.rows[0];
};

// completed check (chi danh gia khi da kham xong)
const checkCompletedAppointmentForReview = async (
  patientId,
  serviceId,
  appointmentId,
) => {
  const query = `
    SELECT id
    FROM appointments
    WHERE id = $1
      AND patient_id = $2
      AND service_id = $3
      AND status = 'Completed'
    LIMIT 1
  `;

  const result = await pool.query(query, [appointmentId, patientId, serviceId]);
  return result.rows.length > 0;
};

// create review (them danh gia dich vu)
const createReview = async (reviewData) => {
  const { patient_id, service_id, rating, comment } = reviewData;

  const query = `
    INSERT INTO reviews (
      patient_id,
      service_id,
      rating,
      comment
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      patient_id,
      service_id,
      rating,
      comment,
      created_at
  `;

  const values = [patient_id, service_id, rating, comment || null];
  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAllReviews,
  getReviewsByPatientId,
  findExistingReview,
  checkCompletedAppointmentForReview,
  createReview,
};
