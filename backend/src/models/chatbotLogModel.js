const pool = require("../config/db");

const getAllChatbotLogs = async () => {
  const query = `
    SELECT
      id,
      user_id,
      question,
      answer,
      created_at
    FROM chatbot_logs
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const createChatbotLog = async (logData) => {
  const { user_id, question, answer } = logData;

  const query = `
    INSERT INTO chatbot_logs (
      user_id,
      question,
      answer
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      user_id,
      question,
      answer,
      created_at
  `;

  const values = [user_id || null, question, answer];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const checkChatbotUserExists = async (userId) => {
  if (!userId) {
    return true;
  }

  const query = `
    SELECT id
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.length > 0;
};

module.exports = {
  getAllChatbotLogs,
  createChatbotLog,
  checkChatbotUserExists,
};
