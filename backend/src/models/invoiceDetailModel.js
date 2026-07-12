const pool = require("../config/db");

// invoice detail list (lay chi tiet hoa don)
const getAllInvoiceDetails = async () => {
  const query = `
    SELECT
      id,
      invoice_id,
      service_id,
      quantity,
      unit_price,
      discount_amount,
      subtotal
    FROM invoice_details
    ORDER BY id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// create detail (them dong dich vu vao hoa don)
const createInvoiceDetail = async (detailData) => {
  const {
    invoice_id,
    service_id,
    quantity,
    unit_price,
    discount_amount,
    subtotal,
  } = detailData;

  const query = `
    INSERT INTO invoice_details (
      invoice_id,
      service_id,
      quantity,
      unit_price,
      discount_amount,
      subtotal
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING
      id,
      invoice_id,
      service_id,
      quantity,
      unit_price,
      discount_amount,
      subtotal
  `;

  const values = [
    invoice_id,
    service_id,
    quantity || 1,
    unit_price,
    discount_amount || 0,
    subtotal,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// check refs (kiem tra hoa don va dich vu)
const checkInvoiceDetailReferences = async (invoiceId, serviceId) => {
  const invoiceQuery = "SELECT id FROM invoices WHERE id = $1";
  const serviceQuery = "SELECT id FROM services WHERE id = $1";

  const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);
  const serviceResult = await pool.query(serviceQuery, [serviceId]);

  return {
    invoiceExists: invoiceResult.rows.length > 0,
    serviceExists: serviceResult.rows.length > 0,
  };
};

module.exports = {
  getAllInvoiceDetails,
  createInvoiceDetail,
  checkInvoiceDetailReferences,
};
