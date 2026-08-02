// truy van du lieu benh an
const pool = require("../config/db");

const RECORD_STATUSES = ["PendingConfirmation", "Confirmed"];

const recordSelect = `
  SELECT
    mr.*,
    TO_CHAR(mr.re_examination_date, 'YYYY-MM-DD') AS re_examination_date,
    TO_CHAR(mr.re_examination_date, 'DD/MM/YYYY') AS re_examination_date_display,
    p.full_name AS patient_name,
    p.phone AS patient_phone,
    p.user_id AS patient_user_id,
    TO_CHAR(a.appointment_date, 'YYYY-MM-DD') AS appointment_date,
    TO_CHAR(a.appointment_date, 'DD/MM/YYYY') AS appointment_date_display,
    a.appointment_time,
    d.full_name AS dentist_name,
    d.user_id AS dentist_user_id,
    u.username AS entered_by_username,
    confirmer.username AS confirmed_by_username,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', mra.id,
            'file_name', mra.file_name,
            'file_url', mra.file_url,
            'file_type', mra.file_type,
            'created_at', mra.created_at
          )
          ORDER BY mra.id DESC
        )
        FROM medical_record_attachments mra
        WHERE mra.medical_record_id = mr.id
      ),
      '[]'::json
    ) AS attachments,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', dce.id,
            'tooth_number', dce.tooth_number,
            'condition_code', dce.condition,
            'treatment_note', dce.treatment_note,
            'note', dce.note
          )
          ORDER BY dce.tooth_number
        )
        FROM dental_chart_entries dce
        WHERE dce.medical_record_id = mr.id
      ),
      '[]'::json
    ) AS teeth
  FROM medical_records mr
  JOIN patients p ON p.id = mr.patient_id
  JOIN dentists d ON d.id = mr.dentist_id
  LEFT JOIN appointments a ON a.id = mr.appointment_id
  LEFT JOIN users u ON u.id = mr.entered_by_user_id
  LEFT JOIN users confirmer ON confirmer.id = mr.confirmed_by_user_id
`;

// transaction (gom cac thay doi cua mot ho so)
const withMedicalRecordTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// record list (loc ho so theo vai tro va tu khoa)
const getMedicalRecords = async (filters = {}) => {
  const values = [];
  const where = [];

  const addFilter = (sql, value) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  if (filters.dentistId) {
    addFilter("mr.dentist_id = ?", filters.dentistId);
  }

  if (filters.patientId) {
    addFilter("mr.patient_id = ?", filters.patientId);
  }

  if (filters.appointmentId) {
    addFilter("mr.appointment_id = ?", filters.appointmentId);
  }

  if (filters.status) {
    addFilter("mr.status::text = ?", filters.status);
  } else {
    where.push("mr.status::text IN ('PendingConfirmation', 'Confirmed')");
  }

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    const placeholder = `$${values.length}`;
    where.push(
      `(p.full_name ILIKE ${placeholder}
        OR p.phone ILIKE ${placeholder}
        OR d.full_name ILIKE ${placeholder})`,
    );
  }

  const query = `
    ${recordSelect}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY mr.created_at DESC, mr.id DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

// record counts (dem tab bang cung dieu kien loc voi danh sach)
const getMedicalRecordCounts = async (filters = {}) => {
  const values = [];
  const where = ["mr.status::text IN ('PendingConfirmation', 'Confirmed')"];

  const addFilter = (sql, value) => {
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  if (filters.dentistId) {
    addFilter("mr.dentist_id = ?", filters.dentistId);
  }

  if (filters.patientId) {
    addFilter("mr.patient_id = ?", filters.patientId);
  }

  if (filters.appointmentId) {
    addFilter("mr.appointment_id = ?", filters.appointmentId);
  }

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    const placeholder = `$${values.length}`;
    where.push(
      `(p.full_name ILIKE ${placeholder}
        OR p.phone ILIKE ${placeholder}
        OR d.full_name ILIKE ${placeholder})`,
    );
  }

  const result = await pool.query(
    `
      SELECT mr.status::text AS status, COUNT(*)::integer AS total
      FROM medical_records mr
      JOIN patients p ON p.id = mr.patient_id
      JOIN dentists d ON d.id = mr.dentist_id
      WHERE ${where.join(" AND ")}
      GROUP BY mr.status::text
    `,
    values,
  );

  return result.rows.reduce(
    (counts, row) => ({
      ...counts,
      [row.status]: row.total,
    }),
    {
      PendingConfirmation: 0,
      Confirmed: 0,
    },
  );
};

// record detail (lay day du mot ho so)
const getMedicalRecordById = async (recordId, db = pool) => {
  const result = await db.query(
    `${recordSelect} WHERE mr.id = $1`,
    [recordId],
  );
  return result.rows[0];
};

// patient records (lay ho so theo khach hang)
const getMedicalRecordsByPatientId = async (
  patientId,
  options = {},
) => {
  return getMedicalRecords({
    patientId,
    dentistId: options.dentistId,
    status: options.confirmedOnly ? "Confirmed" : options.status,
  });
};

// create record (tao ho so dieu tri)
const createMedicalRecord = async (data, db = pool) => {
  const fields = [
    "appointment_id",
    "patient_id",
    "dentist_id",
    "chief_complaint",
    "medical_history",
    "allergies",
    "clinical_examination",
    "diagnosis",
    "treatment",
    "treatment_plan",
    "prescription",
    "note",
    "re_examination_date",
    "re_examination_time",
    "attachment_url",
    "entered_by_user_id",
    "status",
  ];
  const values = fields.map((field) => data[field] ?? null);
  const placeholders = fields.map((_, index) => `$${index + 1}`);

  const result = await db.query(
    `
      INSERT INTO medical_records (${fields.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `,
    values,
  );

  return result.rows[0];
};

// update record (cap nhat noi dung khi chua xac nhan)
const updateMedicalRecord = async (recordId, data, db = pool) => {
  const result = await db.query(
    `
      UPDATE medical_records
      SET
        patient_id = $2,
        dentist_id = $3,
        chief_complaint = $4,
        medical_history = $5,
        allergies = $6,
        clinical_examination = $7,
        diagnosis = $8,
        treatment = $9,
        treatment_plan = $10,
        prescription = $11,
        note = $12,
        re_examination_date = $13,
        re_examination_time = $14,
        attachment_url = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [
      recordId,
      data.patient_id,
      data.dentist_id,
      data.chief_complaint || null,
      data.medical_history || null,
      data.allergies || null,
      data.clinical_examination || null,
      data.diagnosis || null,
      data.treatment || null,
      data.treatment_plan || null,
      data.prescription || null,
      data.note || null,
      data.re_examination_date || null,
      data.re_examination_time || null,
      data.attachment_url || null,
    ],
  );

  return result.rows[0];
};

// status update (gui duyet hoac xac nhan)
const updateMedicalRecordStatus = async (
  recordId,
  status,
  confirmedByUserId,
  db = pool,
) => {
  const result = await db.query(
    `
      UPDATE medical_records
      SET
        status = $2,
        confirmed_by_user_id = CASE WHEN $4 THEN $3::integer ELSE NULL END,
        confirmed_at = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [recordId, status, confirmedByUserId || null, status === "Confirmed"],
  );
  return result.rows[0];
};

// check refs (kiem tra khach, nha si va lich hen)
const checkMedicalRecordReferences = async (
  patientId,
  dentistId,
  appointmentId,
  db = pool,
) => {
  const [patientResult, dentistResult] = await Promise.all([
    db.query("SELECT id, user_id FROM patients WHERE id = $1", [patientId]),
    db.query(
      `
        SELECT d.id, d.user_id, d.is_active, COALESCE(u.is_active, TRUE) AS user_is_active
        FROM dentists d
        LEFT JOIN users u ON u.id = d.user_id
        WHERE d.id = $1
      `,
      [dentistId],
    ),
  ]);

  let appointment = null;
  if (appointmentId) {
    const appointmentResult = await db.query(
      `
        SELECT id, patient_id, dentist_id, status
        FROM appointments
        WHERE id = $1
      `,
      [appointmentId],
    );
    appointment = appointmentResult.rows[0] || null;
  }

  return {
    patient: patientResult.rows[0] || null,
    dentist: dentistResult.rows[0] || null,
    appointment,
  };
};

// find by appointment (chan mot lich co hai ho so)
const findMedicalRecordByAppointmentId = async (
  appointmentId,
  db = pool,
) => {
  if (!appointmentId) return null;
  const result = await db.query(
    "SELECT id, status FROM medical_records WHERE appointment_id = $1",
    [appointmentId],
  );
  return result.rows[0] || null;
};

// re-exam conflict (kiem tra trung lich tai kham)
const checkReExaminationConflict = async (
  dentistId,
  date,
  time,
  excludeRecordId,
  db = pool,
) => {
  if (!dentistId || !date || !time) return false;

  const result = await db.query(
    `
      SELECT id
      FROM medical_records
      WHERE dentist_id = $1
        AND re_examination_date = $2
        AND re_examination_time = $3
        AND ($4::integer IS NULL OR id <> $4)
    `,
    [dentistId, date, time, excludeRecordId || null],
  );
  return result.rowCount > 0;
};

// complete appointment (chi chay sau khi nha si xac nhan)
const completeAppointment = async (appointmentId, db = pool) => {
  if (!appointmentId) return null;
  const result = await db.query(
    `
      UPDATE appointments
      SET status = 'Completed'
      WHERE id = $1
      RETURNING *
    `,
    [appointmentId],
  );
  return result.rows[0] || null;
};

// assign dentist (gan nha si cho lich chua phan cong)
const assignAppointmentDentist = async (
  appointmentId,
  dentistId,
  db = pool,
) => {
  if (!appointmentId) return null;

  const result = await db.query(
    `
      UPDATE appointments
      SET dentist_id = $2
      WHERE id = $1
        AND dentist_id IS NULL
      RETURNING *
    `,
    [appointmentId, dentistId],
  );

  return result.rows[0] || null;
};

module.exports = {
  withMedicalRecordTransaction,
  RECORD_STATUSES,
  getMedicalRecords,
  getMedicalRecordCounts,
  getMedicalRecordById,
  getMedicalRecordsByPatientId,
  createMedicalRecord,
  updateMedicalRecord,
  updateMedicalRecordStatus,
  checkMedicalRecordReferences,
  findMedicalRecordByAppointmentId,
  checkReExaminationConflict,
  completeAppointment,
  assignAppointmentDentist,
};
