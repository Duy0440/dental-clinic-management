const pool = require("../config/db");

const recordPageVisit = async ({ path, userAgent, ip }) => {
  const query = `
    INSERT INTO page_visits (page_path, user_agent, ip_address)
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  const result = await pool.query(query, [
    path || "/",
    userAgent || null,
    ip || null,
  ]);

  return result.rows[0];
};

const relationExists = async (tableName) => {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `,
    [tableName],
  );

  return Boolean(result.rows[0]?.exists);
};

const columnExists = async (tableName, columnName) => {
  const result = await pool.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [tableName, columnName],
  );

  return Boolean(result.rows[0]?.exists);
};

const queryOne = async (query, values) => {
  const result = await pool.query(query, values);
  return result.rows[0] || {};
};

const toNumber = (value) => Number(value || 0);

const getDashboardSummary = async ({ from, to } = {}) => {
  const values = [from, to];
  const [hasPaymentsTable, hasBookingSource, hasTreatmentGroup] = await Promise.all([
    relationExists("payments"),
    columnExists("appointments", "booking_source"),
    columnExists("invoice_details", "treatment_group"),
  ]);
  const serviceNameExpression = hasTreatmentGroup
    ? "COALESCE(NULLIF(idt.treatment_group, ''), s.service_name, idt.custom_description, 'Dịch vụ khác')"
    : "COALESCE(s.service_name, idt.custom_description, 'Dịch vụ khác')";

  const paymentSummaryPromise = hasPaymentsTable
    ? queryOne(
        `
          SELECT
            COALESCE(SUM(pmt.amount), 0) AS collected_amount,
            COUNT(pmt.id) AS payment_count
          FROM payments pmt
          JOIN invoices i ON i.id = pmt.invoice_id
          WHERE pmt.payment_date BETWEEN $1::date AND $2::date
            AND i.payment_status <> 'Cancelled'
        `,
        values,
      )
    : Promise.resolve({ collected_amount: null, payment_count: null });

  const revenueSeriesPromise = hasPaymentsTable
    ? pool.query(
        `
          WITH days AS (
            SELECT GENERATE_SERIES($1::date, $2::date, INTERVAL '1 day')::date AS day
          )
          SELECT
            TO_CHAR(days.day, 'DD/MM') AS label,
            days.day AS bucket_date,
            COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN pmt.amount ELSE 0 END), 0) AS revenue
          FROM days
          LEFT JOIN payments pmt ON pmt.payment_date = days.day
          LEFT JOIN invoices i ON i.id = pmt.invoice_id AND i.payment_status <> 'Cancelled'
          GROUP BY days.day
          ORDER BY days.day ASC
        `,
        values,
      )
    : Promise.resolve({ rows: [] });

  const serviceStatsPromise = pool.query(
    `
      SELECT
        ${serviceNameExpression} AS service_name,
        COUNT(idt.id) AS usage_count,
        COALESCE(SUM(idt.quantity), 0) AS quantity,
        COALESCE(SUM(idt.subtotal), 0) AS service_value
      FROM invoice_details idt
      JOIN invoices i ON i.id = idt.invoice_id
      LEFT JOIN services s ON s.id = idt.service_id
      WHERE i.created_at >= $1::date
        AND i.created_at < ($2::date + INTERVAL '1 day')
        AND i.payment_status <> 'Cancelled'
      GROUP BY ${serviceNameExpression}
      ORDER BY service_value DESC, usage_count DESC
      LIMIT 8
    `,
    values,
  );

  const appointmentSourceSelect = hasBookingSource
    ? "COUNT(*) FILTER (WHERE a.booking_source IN ('website', 'customer', 'guest')) AS web_booking_count"
    : "NULL::integer AS web_booking_count";

  const recentSourceSelect = hasBookingSource
    ? "a.booking_source"
    : "NULL::text AS booking_source";

  const [
    paymentSummary,
    debtSummary,
    appointmentSummary,
    patientSummary,
    medicalRecordSummary,
    visitSummary,
    statusResult,
    revenueSeriesResult,
    serviceStatsResult,
    recentAppointmentsResult,
    upcomingReExamsResult,
    paymentsResult,
  ] = await Promise.all([
    paymentSummaryPromise,
    queryOne(
      `
        SELECT
          COUNT(*) FILTER (WHERE payment_status IN ('Unpaid', 'PartiallyPaid')) AS open_invoice_count,
          COALESCE(SUM(remaining_amount) FILTER (WHERE payment_status IN ('Unpaid', 'PartiallyPaid')), 0) AS debt_amount,
          COALESCE(SUM(discount_amount) FILTER (
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
              AND payment_status <> 'Cancelled'
          ), 0) AS discount_amount,
          COUNT(*) FILTER (
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
              AND payment_status <> 'Cancelled'
          ) AS invoice_count
        FROM invoices
      `,
      values,
    ),
    queryOne(
      `
        SELECT
          COUNT(*) AS appointment_count,
          COUNT(*) FILTER (WHERE appointment_date = CURRENT_DATE) AS today_appointment_count,
          COUNT(*) FILTER (WHERE status = 'Pending') AS pending_appointment_count,
          COUNT(*) FILTER (WHERE status = 'Confirmed') AS confirmed_appointment_count,
          COUNT(*) FILTER (WHERE status = 'Completed') AS completed_appointment_count,
          COUNT(*) FILTER (WHERE status = 'Cancelled') AS cancelled_appointment_count,
          ${appointmentSourceSelect}
        FROM appointments a
        WHERE a.appointment_date BETWEEN $1::date AND $2::date
      `,
      values,
    ),
    queryOne(
      `
        SELECT
          COUNT(*) AS customer_count,
          COUNT(*) FILTER (
            WHERE created_at >= $1::date
              AND created_at < ($2::date + INTERVAL '1 day')
          ) AS new_customer_count
        FROM patients
      `,
      values,
    ),
    queryOne(
      `
        SELECT
          COUNT(*) FILTER (WHERE status = 'PendingConfirmation') AS pending_record_count,
          COUNT(*) FILTER (
            WHERE status = 'Confirmed'
              AND confirmed_at >= $1::date
              AND confirmed_at < ($2::date + INTERVAL '1 day')
          ) AS confirmed_record_count,
          COUNT(*) FILTER (
            WHERE re_examination_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
          ) AS upcoming_reexam_count
        FROM medical_records
      `,
      values,
    ),
    queryOne(
      `
        SELECT
          COUNT(*) AS visit_count,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS today_visit_count
        FROM page_visits
        WHERE created_at >= $1::date
          AND created_at < ($2::date + INTERVAL '1 day')
      `,
      values,
    ),
    pool.query(
      `
        SELECT status, COUNT(*) AS total
        FROM appointments
        WHERE appointment_date BETWEEN $1::date AND $2::date
        GROUP BY status
        ORDER BY total DESC
      `,
      values,
    ),
    revenueSeriesPromise,
    serviceStatsPromise,
    pool.query(
      `
        SELECT
          a.id,
          TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
          TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date_display,
          TO_CHAR(a.appointment_time, 'HH24:MI') AS appointment_time,
          a.status,
          ${recentSourceSelect},
          p.full_name AS patient_name,
          p.phone AS patient_phone,
          d.full_name AS dentist_name,
          s.service_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN dentists d ON a.dentist_id = d.id
        JOIN services s ON a.service_id = s.id
        WHERE a.appointment_date BETWEEN $1::date AND $2::date
        ORDER BY a.appointment_date DESC, a.appointment_time DESC, a.created_at DESC
        LIMIT 7
      `,
      values,
    ),
    pool.query(
      `
        SELECT
          mr.id,
          TO_CHAR(mr.re_examination_date, 'DD/MM/YYYY') AS re_examination_date_display,
          TO_CHAR(mr.re_examination_time, 'HH24:MI') AS re_examination_time,
          p.full_name AS patient_name,
          p.phone AS patient_phone,
          mr.treatment_plan,
          mr.note
        FROM medical_records mr
        JOIN patients p ON p.id = mr.patient_id
        WHERE mr.re_examination_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
        ORDER BY mr.re_examination_date ASC, mr.re_examination_time ASC
        LIMIT 6
      `,
    ),
    hasPaymentsTable
      ? pool.query(
          `
            SELECT
              pmt.id,
              TO_CHAR(pmt.payment_date, 'DD/MM/YYYY') AS payment_date_display,
              p.full_name AS patient_name,
              pmt.amount,
              pmt.payment_method,
              u.username AS created_by_username
            FROM payments pmt
            JOIN invoices i ON i.id = pmt.invoice_id
            JOIN patients p ON p.id = i.patient_id
            LEFT JOIN users u ON u.id = pmt.created_by_user_id
            WHERE pmt.payment_date BETWEEN $1::date AND $2::date
              AND i.payment_status <> 'Cancelled'
            ORDER BY pmt.payment_date DESC, pmt.id DESC
            LIMIT 100
          `,
          values,
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const serviceTotalValue = serviceStatsResult.rows.reduce(
    (total, item) => total + toNumber(item.service_value),
    0,
  );
  const visits = toNumber(visitSummary.visit_count);
  const webBookings = appointmentSummary.web_booking_count === null
    ? null
    : toNumber(appointmentSummary.web_booking_count);

  return {
    range: { from, to },
    metadata: {
      payment_tracking_available: hasPaymentsTable,
      booking_source_available: hasBookingSource,
      visit_tracking_available: true,
    },
    overview: {
      collected_amount: hasPaymentsTable ? toNumber(paymentSummary.collected_amount) : null,
      payment_count: hasPaymentsTable ? toNumber(paymentSummary.payment_count) : null,
      debt_amount: toNumber(debtSummary.debt_amount),
      discount_amount: toNumber(debtSummary.discount_amount),
      open_invoice_count: toNumber(debtSummary.open_invoice_count),
      invoice_count: toNumber(debtSummary.invoice_count),
      appointment_count: toNumber(appointmentSummary.appointment_count),
      today_appointment_count: toNumber(appointmentSummary.today_appointment_count),
      pending_appointment_count: toNumber(appointmentSummary.pending_appointment_count),
      confirmed_appointment_count: toNumber(appointmentSummary.confirmed_appointment_count),
      completed_appointment_count: toNumber(appointmentSummary.completed_appointment_count),
      cancelled_appointment_count: toNumber(appointmentSummary.cancelled_appointment_count),
      web_booking_count: webBookings,
      customer_count: toNumber(patientSummary.customer_count),
      new_customer_count: toNumber(patientSummary.new_customer_count),
      pending_record_count: toNumber(medicalRecordSummary.pending_record_count),
      confirmed_record_count: toNumber(medicalRecordSummary.confirmed_record_count),
      upcoming_reexam_count: toNumber(medicalRecordSummary.upcoming_reexam_count),
      visit_count: visits,
      today_visit_count: toNumber(visitSummary.today_visit_count),
      web_booking_conversion_rate:
        webBookings !== null && visits > 0 ? Number(((webBookings / visits) * 100).toFixed(1)) : null,
    },
    appointment_status: statusResult.rows.map((item) => ({
      status: item.status,
      total: toNumber(item.total),
    })),
    revenue_series: revenueSeriesResult.rows.map((item) => ({
      label: item.label,
      revenue: toNumber(item.revenue),
    })),
    service_stats: serviceStatsResult.rows.map((item) => ({
      service_name: item.service_name,
      usage_count: toNumber(item.usage_count),
      quantity: toNumber(item.quantity),
      service_value: toNumber(item.service_value),
      share: serviceTotalValue > 0
        ? Number(((toNumber(item.service_value) / serviceTotalValue) * 100).toFixed(1))
        : 0,
    })),
    recent_appointments: recentAppointmentsResult.rows,
    upcoming_re_examinations: upcomingReExamsResult.rows,
    payments: paymentsResult.rows.map((item) => ({
      ...item,
      amount: toNumber(item.amount),
    })),
  };
};

module.exports = {
  recordPageVisit,
  getDashboardSummary,
};
