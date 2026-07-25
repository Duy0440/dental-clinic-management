const pool = require("../config/db");

// audit log (luu nguoi va noi dung da thay doi)
const createMedicalRecordAuditLog = async (
  {
    medicalRecordId,
    action,
    changedByUserId,
    oldData,
    newData,
  },
  db = pool,
) => {
  const result = await db.query(
    `
      INSERT INTO medical_record_audit_logs (
        medical_record_id,
        action,
        changed_by_user_id,
        old_data,
        new_data
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      medicalRecordId,
      action,
      changedByUserId || null,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
    ],
  );
  return result.rows[0];
};

// audit history (xem lich su thay doi ho so)
const getMedicalRecordAuditLogs = async (recordId) => {
  const result = await pool.query(
    `
      SELECT
        log.*,
        u.username AS changed_by_username,
        u.role AS changed_by_role
      FROM medical_record_audit_logs log
      LEFT JOIN users u ON u.id = log.changed_by_user_id
      WHERE log.medical_record_id = $1
      ORDER BY log.created_at DESC, log.id DESC
    `,
    [recordId],
  );
  return result.rows;
};

module.exports = {
  createMedicalRecordAuditLog,
  getMedicalRecordAuditLogs,
};
