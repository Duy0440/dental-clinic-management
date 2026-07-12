const pool = require("../config/db");

// invoice list (lay danh sach hoa don)
const getAllInvoices = async () => {
  const query = `
    SELECT
      i.id,
      i.patient_id,
      i.appointment_id,
      i.invoice_code,
      i.total_amount,
      i.paid_amount,
      i.payment_status,
      i.payment_method,
      i.issued_by,
      i.created_at,
      p.full_name AS patient_name,
      p.phone AS patient_phone,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', idt.id,
            'service_id', idt.service_id,
            'service_name', s.service_name,
            'custom_description', idt.custom_description,
            'quantity', idt.quantity,
            'unit_price', idt.unit_price,
            'discount_amount', idt.discount_amount,
            'subtotal', idt.subtotal
          )
        ) FILTER (WHERE idt.id IS NOT NULL),
        '[]'::json
      ) AS details
    FROM invoices i
    JOIN patients p ON i.patient_id = p.id
    LEFT JOIN invoice_details idt ON idt.invoice_id = i.id
    LEFT JOIN services s ON idt.service_id = s.id
    GROUP BY
      i.id,
      i.patient_id,
      i.appointment_id,
      i.invoice_code,
      i.total_amount,
      i.paid_amount,
      i.payment_status,
      i.payment_method,
      i.issued_by,
      i.created_at,
      p.full_name,
      p.phone
    ORDER BY i.id DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// find invoice (tim hoa don theo ma)
const findInvoiceByCode = async (invoiceCode) => {
  const query = `
    SELECT id
    FROM invoices
    WHERE invoice_code = $1
  `;

  const result = await pool.query(query, [invoiceCode]);
  return result.rows[0];
};

// check refs (kiem tra khach hang va lich hen)
const checkInvoiceReferences = async (patientId, appointmentId) => {
  const patientQuery = "SELECT id FROM patients WHERE id = $1";
  const patientResult = await pool.query(patientQuery, [patientId]);

  let appointmentExists = true;

  if (appointmentId) {
    const appointmentQuery = "SELECT id FROM appointments WHERE id = $1";
    const appointmentResult = await pool.query(appointmentQuery, [appointmentId]);
    appointmentExists = appointmentResult.rows.length > 0;
  }

  return {
    patientExists: patientResult.rows.length > 0,
    appointmentExists,
  };
};

// transaction (tao hoa don va chi tiet cung luc)
const createInvoiceWithDetails = async (invoiceData) => {
  const {
    patient_id,
    appointment_id,
    invoice_code,
    payment_method,
    issued_by,
    details,
  } = invoiceData;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const normalizedDetails = details.map((item) => {
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      const discountAmount = Number(item.discount_amount || 0);
      const subtotal = quantity * unitPrice - discountAmount;

      return {
        service_id: item.service_id ? Number(item.service_id) : null,
        custom_description: item.custom_description || null,
        quantity,
        unit_price: unitPrice,
        discount_amount: discountAmount,
        subtotal: subtotal > 0 ? subtotal : 0,
      };
    });

    const totalAmount = normalizedDetails.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    const invoiceQuery = `
      INSERT INTO invoices (
        patient_id,
        appointment_id,
        invoice_code,
        total_amount,
        paid_amount,
        payment_status,
        payment_method,
        issued_by
      )
      VALUES ($1, $2, $3, $4, $5, 'Paid', $6, $7)
      RETURNING
        id,
        patient_id,
        appointment_id,
        invoice_code,
        total_amount,
        paid_amount,
        payment_status,
        payment_method,
        issued_by,
        created_at
    `;

    const invoiceValues = [
      patient_id,
      appointment_id || null,
      invoice_code,
      totalAmount,
      totalAmount,
      payment_method || "Tiền mặt",
      issued_by || null,
    ];

    const invoiceResult = await client.query(invoiceQuery, invoiceValues);
    const invoice = invoiceResult.rows[0];
    const createdDetails = [];

    for (const detail of normalizedDetails) {
      const detailQuery = `
        INSERT INTO invoice_details (
          invoice_id,
          service_id,
          custom_description,
          quantity,
          unit_price,
          discount_amount,
          subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          invoice_id,
          service_id,
          custom_description,
          quantity,
          unit_price,
          discount_amount,
          subtotal
      `;

      const detailValues = [
        invoice.id,
        detail.service_id,
        detail.custom_description,
        detail.quantity,
        detail.unit_price,
        detail.discount_amount,
        detail.subtotal,
      ];

      const detailResult = await client.query(detailQuery, detailValues);
      createdDetails.push(detailResult.rows[0]);
    }

    await client.query("COMMIT");

    return {
      ...invoice,
      details: createdDetails,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// delete invoice (xoa hoa don theo id)
const deleteInvoiceById = async (invoiceId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM invoice_details WHERE invoice_id = $1", [invoiceId]);

    const result = await client.query(
      "DELETE FROM invoices WHERE id = $1 RETURNING id",
      [invoiceId],
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllInvoices,
  findInvoiceByCode,
  checkInvoiceReferences,
  createInvoiceWithDetails,
  deleteInvoiceById,
};
