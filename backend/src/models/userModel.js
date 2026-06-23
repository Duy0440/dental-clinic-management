const pool = require("../config/db");

const findUserByUsername = async (username) => {
  const query = `
    SELECT id, username, password, role, phone, email
    FROM users
    WHERE username = $1
  `;

  const result = await pool.query(query, [username]);
  return result.rows[0];
};

const createUser = async (userData) => {
  const { username, password, role, phone, email } = userData;

  const query = `
    INSERT INTO users (username, password, role, phone, email)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, role, phone, email
  `;

  const values = [username, password, role || "customer", phone, email || null];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  findUserByUsername,
  createUser,
};
