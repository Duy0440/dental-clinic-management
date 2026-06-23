const pool = require("../config/db");

const getAllServices = async () => {
  const query = `
    SELECT
      id,
      service_name,
      price,
      description,
      duration_minutes,
      is_active
    FROM services
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const createService = async (serviceData) => {
  const { service_name, price, description, duration_minutes, is_active } =
    serviceData;

  const query = `
    INSERT INTO services (
      service_name,
      price,
      description,
      duration_minutes,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      service_name,
      price,
      description,
      duration_minutes,
      is_active
  `;

  const values = [
    service_name,
    price,
    description || null,
    duration_minutes || null,
    is_active ?? true,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

module.exports = {
  getAllServices,
  createService,
};
