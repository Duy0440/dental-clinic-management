const pool = require("../config/db");

const findUserByUsername = async (username) => {
  const query = `
    SELECT
      id,
      username,
      password,
      role,
      phone,
      email,
      is_active
    FROM users
    WHERE username = $1
  `;

  const result = await pool.query(query, [username]);
  return result.rows[0];
};

const createUser = async (userData) => {
  const { username, password, role, phone, email } = userData;

  const query = `
    INSERT INTO users (
      username,
      password,
      role,
      phone,
      email,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, TRUE)
    RETURNING
      id,
      username,
      role,
      phone,
      email,
      is_active
  `;

  const values = [username, password, role || "customer", phone, email || null];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const updateUserActiveStatus = async (userId, isActive) => {
  const query = `
    UPDATE users
    SET is_active = $2
    WHERE id = $1
    RETURNING
      id,
      username,
      role,
      phone,
      email,
      is_active
  `;

  const result = await pool.query(query, [userId, isActive]);
  return result.rows[0];
};

const updateUserPasswordById = async (userId, hashedPassword) => {
  const query = `
    UPDATE users
    SET password = $2
    WHERE id = $1
    RETURNING
      id,
      username,
      role,
      phone,
      email,
      is_active
  `;

  const result = await pool.query(query, [userId, hashedPassword]);
  return result.rows[0];
};

module.exports = {
  findUserByUsername,
  createUser,
  updateUserActiveStatus,
  updateUserPasswordById,
};
