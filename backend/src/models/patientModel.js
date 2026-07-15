const pool = require("../config/db");

// patient list (lay danh sach khach hang)
const getAllPatients = async () => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
    FROM patients
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// create patient (them ho so khach hang)
const createPatient = async (patientData) => {
  const { user_id, full_name, phone, gender, birth_date, address } =
    patientData;

  const query = `
    INSERT INTO patients (
      user_id,
      full_name,
      phone,
      gender,
      birth_date,
      address
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
  `;

  const values = [
    user_id || null,
    full_name,
    phone,
    gender || null,
    birth_date || null,
    address || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// find by user (tim khach hang theo tai khoan)
const findPatientByUserId = async (userId) => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
    FROM patients
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

// find patient (tim khach hang theo id)
const findPatientById = async (patientId) => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
    FROM patients
    WHERE id = $1
  `;

  const result = await pool.query(query, [patientId]);
  return result.rows[0];
};

// find by phone (tim ho so khach theo so dien thoai)
const findPatientByPhone = async (phone) => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
    FROM patients
    WHERE phone = $1
    ORDER BY id DESC
    LIMIT 1
  `;

  const result = await pool.query(query, [phone]);
  return result.rows[0];
};

// link account (gan tai khoan cho ho so khach)
const updatePatientUserId = async (patientId, userId) => {
  const query = `
    UPDATE patients
    SET user_id = $2
    WHERE id = $1
    RETURNING
      id,
      user_id,
      full_name,
      phone,
      gender,
      TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
      TO_CHAR(birth_date, 'DD/MM/YYYY') AS birth_date_display,
      address,
      created_at
  `;

  const result = await pool.query(query, [patientId, userId]);
  return result.rows[0];
};

module.exports = {
  getAllPatients,
  createPatient,
  findPatientByUserId,
  findPatientById,
  findPatientByPhone,
  updatePatientUserId,
};
