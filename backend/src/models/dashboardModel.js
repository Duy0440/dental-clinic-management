const pool = require("../config/db");

// track visit (luu luot truy cap)
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

// dashboard summary (tong hop so lieu admin)
const getDashboardSummary = async () => {
  const [
    overviewResult,
    appointmentStatusResult,
    serviceStatsResult,
    revenueResult,
    monthlyStatsResult,
    recentAppointmentsResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM patients) AS customer_count,
        (SELECT COUNT(*) FROM dentists WHERE COALESCE(is_active, TRUE) = TRUE) AS dentist_count,
        (SELECT COUNT(*) FROM services WHERE COALESCE(is_active, TRUE) = TRUE) AS active_service_count,
        (SELECT COUNT(*) FROM appointments) AS appointment_count,
        (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) AS today_appointment_count,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Pending') AS pending_appointment_count,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed') AS confirmed_appointment_count,
        (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') AS completed_appointment_count,
        (SELECT COUNT(*) FROM invoices) AS invoice_count,
        (SELECT COUNT(*) FROM invoices WHERE payment_status IN ('Unpaid', 'Partial')) AS open_invoice_count,
        (SELECT COUNT(*) FROM medical_records WHERE DATE(created_at) = CURRENT_DATE) AS today_record_count,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE DATE(created_at) = CURRENT_DATE) AS today_revenue,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS month_revenue,
        (SELECT COUNT(*) FROM page_visits WHERE DATE(created_at) = CURRENT_DATE) AS today_visit_count,
        (SELECT COUNT(*) FROM page_visits WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS month_visit_count
    `),

    pool.query(`
      SELECT status, COUNT(*) AS total
      FROM appointments
      GROUP BY status
      ORDER BY total DESC
    `),

    pool.query(`
      SELECT
        s.service_name,
        COUNT(a.id) AS total
      FROM services s
      LEFT JOIN appointments a
        ON a.service_id = s.id
       AND a.created_at >= CURRENT_DATE - INTERVAL '30 days'
      WHERE COALESCE(s.is_active, TRUE) = TRUE
      GROUP BY s.id, s.service_name
      ORDER BY total DESC, s.service_name ASC
      LIMIT 6
    `),

    pool.query(`
      SELECT
        TO_CHAR(days.day, 'DD/MM') AS label,
        COALESCE(SUM(i.paid_amount), 0) AS revenue
      FROM GENERATE_SERIES(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS days(day)
      LEFT JOIN invoices i ON DATE(i.created_at) = days.day
      GROUP BY days.day
      ORDER BY days.day ASC
    `),

    pool.query(`
      WITH months AS (
        SELECT GENERATE_SERIES(
          DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
          DATE_TRUNC('month', CURRENT_DATE),
          INTERVAL '1 month'
        ) AS month_start
      )
      SELECT
        TO_CHAR(month_start, 'MM/YYYY') AS label,
        COALESCE((
          SELECT SUM(i.paid_amount)
          FROM invoices i
          WHERE DATE_TRUNC('month', i.created_at) = month_start
        ), 0) AS revenue,
        COALESCE((
          SELECT COUNT(*)
          FROM page_visits pv
          WHERE DATE_TRUNC('month', pv.created_at) = month_start
        ), 0) AS visits
      FROM months
      ORDER BY month_start ASC
    `),

    pool.query(`
      SELECT
        a.id,
        TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date_display,
        a.appointment_time,
        a.status,
        p.full_name AS patient_name,
        d.full_name AS dentist_name,
        s.service_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      LEFT JOIN dentists d ON a.dentist_id = d.id
      JOIN services s ON a.service_id = s.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `),
  ]);

  const overview = overviewResult.rows[0];

  return {
    overview: {
      customer_count: Number(overview.customer_count),
      dentist_count: Number(overview.dentist_count),
      active_service_count: Number(overview.active_service_count),
      appointment_count: Number(overview.appointment_count),
      today_appointment_count: Number(overview.today_appointment_count),
      pending_appointment_count: Number(overview.pending_appointment_count),
      confirmed_appointment_count: Number(overview.confirmed_appointment_count),
      completed_appointment_count: Number(overview.completed_appointment_count),
      invoice_count: Number(overview.invoice_count),
      open_invoice_count: Number(overview.open_invoice_count),
      today_record_count: Number(overview.today_record_count),
      today_revenue: Number(overview.today_revenue),
      month_revenue: Number(overview.month_revenue),
      today_visit_count: Number(overview.today_visit_count),
      month_visit_count: Number(overview.month_visit_count),
    },
    appointment_status: appointmentStatusResult.rows.map((item) => ({
      status: item.status,
      total: Number(item.total),
    })),
    service_stats: serviceStatsResult.rows.map((item) => ({
      service_name: item.service_name,
      total: Number(item.total),
    })),
    revenue_last_7_days: revenueResult.rows.map((item) => ({
      label: item.label,
      revenue: Number(item.revenue),
    })),
    monthly_stats: monthlyStatsResult.rows.map((item) => ({
      label: item.label,
      revenue: Number(item.revenue),
      visits: Number(item.visits),
    })),
    recent_appointments: recentAppointmentsResult.rows,
  };
};

module.exports = {
  recordPageVisit,
  getDashboardSummary,
};
