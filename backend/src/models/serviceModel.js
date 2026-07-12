const pool = require("../config/db");

// active services (lay dich vu dang hien thi)
const getActiveServices = async () => {
  const query = `
    SELECT
      id,
      service_name,
      description,
      is_active
    FROM services
    WHERE is_active = TRUE
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// service admin list (lay tat ca dich vu cho admin)
const getAllServicesForAdmin = async () => {
  const query = `
    SELECT
      id,
      service_name,
      description,
      is_active
    FROM services
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// create service (them dich vu)
const createService = async (serviceData) => {
  const { service_name, description, is_active } = serviceData;

  const query = `
    INSERT INTO services (
      service_name,
      price,
      description,
      duration_minutes,
      is_active
    )
    VALUES ($1, NULL, $2, NULL, $3)
    RETURNING
      id,
      service_name,
      description,
      is_active
  `;

  const values = [service_name, description || null, is_active ?? true];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// update service (sua thong tin dich vu)
const updateServiceById = async (serviceId, serviceData) => {
  const { service_name, description, is_active } = serviceData;

  const query = `
    UPDATE services
    SET
      service_name = $1,
      description = $2,
      is_active = $3
    WHERE id = $4
    RETURNING
      id,
      service_name,
      description,
      is_active
  `;

  const values = [
    service_name,
    description || null,
    is_active ?? true,
    serviceId,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// soft delete (an dich vu, khong xoa khoi DB)
const deactivateServiceById = async (serviceId) => {
  const query = `
    UPDATE services
    SET is_active = FALSE
    WHERE id = $1
    RETURNING
      id,
      service_name,
      description,
      is_active
  `;

  const result = await pool.query(query, [serviceId]);
  return result.rows[0];
};

module.exports = {
  getActiveServices,
  getAllServicesForAdmin,
  createService,
  updateServiceById,
  deactivateServiceById,
};
