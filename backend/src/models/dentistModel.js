const pool = require("../config/db");

// dentist list (lay tat ca nha si)
const getAllDentists = async () => {
  const query = `
    SELECT
      d.id,
      d.user_id,
      d.full_name,
      d.specialty,
      d.phone,
      d.email,
      d.is_active,
      u.username,
      u.is_active AS user_is_active
    FROM dentists d
    LEFT JOIN users u ON d.user_id = u.id
    ORDER BY d.id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// active dentists (lay nha si dang hoat dong)
const getActiveDentists = async () => {
  const query = `
    SELECT
      d.id,
      d.full_name,
      d.specialty,
      d.phone,
      d.email,
      d.is_active
    FROM dentists d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE COALESCE(d.is_active, TRUE) = TRUE
      AND COALESCE(u.is_active, TRUE) = TRUE
    ORDER BY d.full_name ASC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// create dentist (them ho so nha si)
const createDentist = async (dentistData) => {
  const { user_id, full_name, specialty, phone, email } = dentistData;

  const query = `
    INSERT INTO dentists (
      user_id,
      full_name,
      specialty,
      phone,
      email,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, TRUE)
    RETURNING
      id,
      user_id,
      full_name,
      specialty,
      phone,
      email,
      is_active
  `;

  const values = [user_id, full_name, specialty || null, phone, email || null];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// find by user (tim nha si theo tai khoan)
const findDentistByUserId = async (userId) => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      specialty,
      phone,
      email,
      is_active
    FROM dentists
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

// active status (tam ngung hoac kich hoat nha si)
const updateDentistActiveStatus = async (dentistId, isActive) => {
  const query = `
    UPDATE dentists
    SET is_active = $2
    WHERE id = $1
    RETURNING
      id,
      user_id,
      full_name,
      specialty,
      phone,
      email,
      is_active
  `;

  const result = await pool.query(query, [dentistId, isActive]);
  return result.rows[0];
};

// find dentist (tim nha si theo id)
const findDentistById = async (dentistId) => {
  const query = `
    SELECT
      d.id,
      d.user_id,
      d.full_name,
      d.specialty,
      d.phone,
      d.email,
      d.is_active,
      COALESCE(u.is_active, TRUE) AS user_is_active
    FROM dentists d
    LEFT JOIN users u ON d.user_id = u.id
    WHERE d.id = $1
  `;

  const result = await pool.query(query, [dentistId]);
  return result.rows[0];
};

module.exports = {
  getAllDentists,
  getActiveDentists,
  createDentist,
  findDentistByUserId,
  updateDentistActiveStatus,
  findDentistById,
};
