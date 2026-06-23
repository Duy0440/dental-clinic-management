const pool = require("../config/db");

const getAllInvoices = async () => {
  const query = `
    SELECT
      i.id,
      i.patient_id,
      i.appointment_id,
      i.invoice_code,
      i.total_amount,
      i.payment_status,
      i.payment_method,
      i.issued_by,
      i.created_at,
      p.full_name AS patient_name
    FROM invoices i
    JOIN patients p ON i.patient_id = p.id
    ORDER BY i.id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

const createInvoice = async (invoiceData) => {
  const {
    patient_id,
    appointment_id,
    invoice_code,
    total_amount,
    payment_status,
    payment_method,
    issued_by,
  } = invoiceData;

  const query = `
    INSERT INTO invoices (
      patient_id,
      appointment_id,
      invoice_code,
      total_amount,
      payment_status,
      payment_method,
      issued_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      id,
      patient_id,
      appointment_id,
      invoice_code,
      total_amount,
      payment_status,
      payment_method,
      issued_by,
      created_at
  `;

  const values = [
    patient_id,
    appointment_id || null,
    invoice_code,
    total_amount,
    payment_status || "Unpaid",
    payment_method || null,
    issued_by || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

const checkInvoiceReferences = async (patientId, appointmentId) => {
  const patientQuery = "SELECT id FROM patients WHERE id = $1";
  const patientResult = await pool.query(patientQuery, [patientId]);

  let appointmentExists = true;

  if (appointmentId) {
    const appointmentQuery = "SELECT id FROM appointments WHERE id = $1";
    const appointmentResult = await pool.query(appointmentQuery, [
      appointmentId,
    ]);
    appointmentExists = appointmentResult.rows.length > 0;
  }

  return {
    patientExists: patientResult.rows.length > 0,
    appointmentExists,
  };
};

const findInvoiceByCode = async (invoiceCode) => {
  const query = `
    SELECT id
    FROM invoices
    WHERE invoice_code = $1
  `;

  const result = await pool.query(query, [invoiceCode]);
  return result.rows[0];
};

module.exports = {
  getAllInvoices,
  createInvoice,
  checkInvoiceReferences,
  findInvoiceByCode,
};
