const pool = require("../config/db");

// create attachment (luu file dinh kem ho so)
const createMedicalRecordAttachment = async (attachmentData) => {
  const {
    medical_record_id,
    file_name,
    file_url,
    file_type,
    uploaded_by_user_id,
  } = attachmentData;

  const query = `
    INSERT INTO medical_record_attachments (
      medical_record_id,
      file_name,
      file_url,
      file_type,
      uploaded_by_user_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      medical_record_id,
      file_name,
      file_url,
      file_type,
      uploaded_by_user_id,
      created_at
  `;

  const values = [
    medical_record_id,
    file_name,
    file_url,
    file_type,
    uploaded_by_user_id,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// attachment list (lay file theo ho so dieu tri)
const getAttachmentsByMedicalRecordId = async (medicalRecordId) => {
  const query = `
    SELECT
      id,
      medical_record_id,
      file_name,
      file_url,
      file_type,
      uploaded_by_user_id,
      created_at
    FROM medical_record_attachments
    WHERE medical_record_id = $1
    ORDER BY id DESC
  `;

  const result = await pool.query(query, [medicalRecordId]);
  return result.rows;
};

module.exports = {
  createMedicalRecordAttachment,
  getAttachmentsByMedicalRecordId,
};
