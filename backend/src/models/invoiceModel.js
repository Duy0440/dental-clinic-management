// truy van ho so thanh toan
const pool = require("../config/db");

const PAYMENT_STATUSES = ["Unpaid", "PartiallyPaid", "Paid", "Cancelled"];
const PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản"];

const money = (value) => Number(value || 0);

const calculateStatus = (paidAmount, totalAmount, currentStatus) => {
  if (currentStatus === "Cancelled") return "Cancelled";
  if (paidAmount <= 0) return "Unpaid";
  if (paidAmount >= totalAmount) return "Paid";
  return "PartiallyPaid";
};

const invoiceSelect = `
  SELECT
    i.id,
    i.patient_id,
    i.appointment_id,
    i.invoice_code,
    i.subtotal,
    i.discount_amount,
    i.discount_reason,
    i.total_amount,
    i.paid_amount,
    i.remaining_amount,
    i.payment_status,
    i.payment_method,
    i.issued_by,
    i.cancelled_at,
    i.cancelled_by_user_id,
    i.updated_at,
    i.created_at,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    issuer.username AS issued_by_username,
    canceller.username AS cancelled_by_username,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', idt.id,
            'service_id', idt.service_id,
            'service_name', s.service_name,
            'treatment_group', COALESCE(idt.treatment_group, s.service_name),
            'custom_description', idt.custom_description,
            'quantity', idt.quantity,
            'unit_price', idt.unit_price,
            'discount_amount', idt.discount_amount,
            'subtotal', idt.subtotal
          )
          ORDER BY idt.id
        )
        FROM invoice_details idt
        LEFT JOIN services s ON s.id = idt.service_id
        WHERE idt.invoice_id = i.id
      ),
      '[]'::json
    ) AS details,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', pay.id,
            'payment_number', pay.payment_number,
            'amount', pay.amount,
            'payment_method', pay.payment_method,
            'payment_date', TO_CHAR(pay.payment_date, 'YYYY-MM-DD'),
            'payment_date_display', TO_CHAR(pay.payment_date, 'DD/MM/YYYY'),
            'appointment_id', pay.appointment_id,
            'note', pay.note,
            'created_by_user_id', pay.created_by_user_id,
            'created_by_username', pay.created_by_username,
            'created_at', pay.created_at,
            'cumulative_paid', pay.cumulative_paid,
            'remaining_after', GREATEST(i.total_amount - pay.cumulative_paid, 0)
          )
          ORDER BY pay.id
        )
        FROM (
          SELECT
            pmt.*,
            u.username AS created_by_username,
            ROW_NUMBER() OVER (PARTITION BY pmt.invoice_id ORDER BY pmt.payment_date, pmt.id) AS payment_number,
            SUM(pmt.amount) OVER (PARTITION BY pmt.invoice_id ORDER BY pmt.payment_date, pmt.id) AS cumulative_paid
          FROM payments pmt
          LEFT JOIN users u ON u.id = pmt.created_by_user_id
          WHERE pmt.invoice_id = i.id
        ) pay
      ),
      '[]'::json
    ) AS payments
  FROM invoices i
  JOIN patients p ON p.id = i.patient_id
  LEFT JOIN users issuer ON issuer.id = i.issued_by
  LEFT JOIN users canceller ON canceller.id = i.cancelled_by_user_id
`;

const buildInvoiceFilters = (filters = {}) => {
  const values = [];
  const where = [];

  const addFilter = (sql, value) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  if (filters.patientId) addFilter("i.patient_id = ?", filters.patientId);
  if (filters.status) addFilter("i.payment_status = ?", filters.status);

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    const placeholder = `$${values.length}`;
    where.push(
      `(i.invoice_code ILIKE ${placeholder}
        OR p.full_name ILIKE ${placeholder}
        OR p.phone ILIKE ${placeholder})`,
    );
  }

  return { values, where };
};

// lay danh sach ho so thanh toan
const getInvoices = async (filters = {}) => {
  const { values, where } = buildInvoiceFilters(filters);
  const result = await pool.query(
    `
      ${invoiceSelect}
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY i.id DESC
    `,
    values,
  );
  return result.rows;
};

// lay chi tiet ho so thanh toan
const getInvoiceById = async (invoiceId, db = pool) => {
  const result = await db.query(`${invoiceSelect} WHERE i.id = $1`, [invoiceId]);
  return result.rows[0] || null;
};

const findInvoiceByCode = async (invoiceCode) => {
  const result = await pool.query("SELECT id FROM invoices WHERE invoice_code = $1", [
    invoiceCode,
  ]);
  return result.rows[0] || null;
};

const checkInvoiceReferences = async (patientId, appointmentId, db = pool) => {
  const patientResult = await db.query("SELECT id FROM patients WHERE id = $1", [
    patientId,
  ]);

  let appointmentExists = true;
  if (appointmentId) {
    const appointmentResult = await db.query(
      "SELECT id FROM appointments WHERE id = $1 AND patient_id = $2",
      [appointmentId, patientId],
    );
    appointmentExists = appointmentResult.rowCount > 0;
  }

  return {
    patientExists: patientResult.rowCount > 0,
    appointmentExists,
  };
};

const normalizeDetails = (details = []) => {
  return details.map((item) => {
    const quantity = money(item.quantity || 1);
    const unitPrice = money(item.unit_price);
    const subtotal = quantity * unitPrice;

    return {
      service_id: item.service_id ? Number(item.service_id) : null,
      treatment_group: item.treatment_group || null,
      custom_description: item.custom_description?.trim() || null,
      quantity,
      unit_price: unitPrice,
      discount_amount: 0,
      subtotal,
    };
  });
};

// them dich vu vao ho so
const insertInvoiceDetail = async (invoiceId, detail, db) => {
  const result = await db.query(
    `
      INSERT INTO invoice_details (
        invoice_id,
        service_id,
        treatment_group,
        custom_description,
        quantity,
        unit_price,
        discount_amount,
        subtotal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      invoiceId,
      detail.service_id,
      detail.treatment_group,
      detail.custom_description,
      detail.quantity,
      detail.unit_price,
      detail.discount_amount,
      detail.subtotal,
    ],
  );
  return result.rows[0];
};

// ghi nhan mot lan thanh toan
const insertPayment = async (paymentData, db) => {
  const result = await db.query(
    `
      INSERT INTO payments (
        invoice_id,
        amount,
        payment_method,
        payment_date,
        appointment_id,
        note,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      paymentData.invoice_id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.payment_date,
      paymentData.appointment_id || null,
      paymentData.note || null,
      paymentData.created_by_user_id || null,
    ],
  );
  return result.rows[0];
};

// tinh tong da tra va con no
const updateInvoiceTotals = async (invoiceId, db) => {
  const paymentResult = await db.query(
    "SELECT COALESCE(SUM(amount), 0) AS paid_amount FROM payments WHERE invoice_id = $1",
    [invoiceId],
  );
  const invoiceResult = await db.query(
    "SELECT total_amount, payment_status FROM invoices WHERE id = $1 FOR UPDATE",
    [invoiceId],
  );
  const invoice = invoiceResult.rows[0];
  const paidAmount = money(paymentResult.rows[0]?.paid_amount);
  const totalAmount = money(invoice.total_amount);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);
  const nextStatus = calculateStatus(
    paidAmount,
    totalAmount,
    invoice.payment_status,
  );

  await db.query(
    `
      UPDATE invoices
      SET
        paid_amount = $2,
        remaining_amount = $3,
        payment_status = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [invoiceId, paidAmount, remainingAmount, nextStatus],
  );

  return getInvoiceById(invoiceId, db);
};

// tao ho so thanh toan kem chi tiet
const createInvoiceWithDetails = async (invoiceData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const details = normalizeDetails(invoiceData.details);
    const subtotal = details.reduce((total, item) => total + item.subtotal, 0);
    const discountAmount = money(invoiceData.discount_amount);
    const totalAmount = Math.max(subtotal - discountAmount, 0);
    const firstPaymentAmount = money(invoiceData.first_payment_amount);
    const initialStatus = calculateStatus(firstPaymentAmount, totalAmount);

    const invoiceResult = await client.query(
      `
        INSERT INTO invoices (
          patient_id,
          appointment_id,
          invoice_code,
          subtotal,
          discount_amount,
          discount_reason,
          total_amount,
          paid_amount,
          remaining_amount,
          payment_status,
          payment_method,
          issued_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        invoiceData.patient_id,
        invoiceData.appointment_id || null,
        invoiceData.invoice_code,
        subtotal,
        discountAmount,
        invoiceData.discount_reason || null,
        totalAmount,
        initialStatus,
        invoiceData.first_payment_method || null,
        invoiceData.issued_by || null,
      ],
    );

    const invoice = invoiceResult.rows[0];

    for (const detail of details) {
      await insertInvoiceDetail(invoice.id, detail, client);
    }

    if (firstPaymentAmount > 0) {
      await insertPayment(
        {
          invoice_id: invoice.id,
          amount: firstPaymentAmount,
          payment_method: invoiceData.first_payment_method,
          payment_date: invoiceData.first_payment_date,
          appointment_id: invoiceData.appointment_id,
          note: invoiceData.note,
          created_by_user_id: invoiceData.issued_by,
        },
        client,
      );
    }

    const result = await updateInvoiceTotals(invoice.id, client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// them thanh toan vao ho so
const addPaymentToInvoice = async (invoiceId, paymentData) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      "SELECT id, total_amount, paid_amount, remaining_amount, payment_status FROM invoices WHERE id = $1 FOR UPDATE",
      [invoiceId],
    );
    const invoice = invoiceResult.rows[0];
    if (!invoice) {
      const error = new Error("PAYMENT_RECORD_NOT_FOUND");
      error.statusCode = 404;
      throw error;
    }

    if (["Paid", "Cancelled"].includes(invoice.payment_status)) {
      const error = new Error("PAYMENT_RECORD_LOCKED");
      error.statusCode = 409;
      throw error;
    }

    const amount = money(paymentData.amount);
    if (amount <= 0 || amount > money(invoice.remaining_amount)) {
      const error = new Error("INVALID_PAYMENT_AMOUNT");
      error.statusCode = 400;
      throw error;
    }

    await insertPayment(
      {
        ...paymentData,
        invoice_id: invoiceId,
      },
      client,
    );

    const result = await updateInvoiceTotals(invoiceId, client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// huy ho so thanh toan
const cancelInvoiceById = async (invoiceId, userId) => {
  const result = await pool.query(
    `
      UPDATE invoices
      SET
        payment_status = 'Cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        cancelled_by_user_id = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND payment_status <> 'Cancelled'
      RETURNING id
    `,
    [invoiceId, userId || null],
  );
  return result.rows[0] || null;
};

module.exports = {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  getInvoices,
  getInvoiceById,
  findInvoiceByCode,
  checkInvoiceReferences,
  createInvoiceWithDetails,
  addPaymentToInvoice,
  cancelInvoiceById,
};
