const pool = require("../config/db");

const getAllDentists = async () => {
  const query = `
    SELECT
      id,
      user_id,
      full_name,
      specialty,
      phone
    FROM dentists
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const createDentist = async (dentistData) => {
  const { user_id, full_name, specialty, phone } = dentistData;

  const query = `
    INSERT INTO dentists (
      user_id,
      full_name,
      specialty,
      phone
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      user_id,
      full_name,
      specialty,
      phone
  `;

  const values = [user_id, full_name, specialty || null, phone];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const findDentistByUserId = async (userId) => {
  const query = `
    SELECT id
    FROM dentists
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

module.exports = {
  getAllDentists,
  createDentist,
  findDentistByUserId,
};
