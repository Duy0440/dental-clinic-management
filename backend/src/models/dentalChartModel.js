const pool = require("../config/db");

const FDI_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
];

const TOOTH_CONDITIONS = [
  "normal",
  "caries",
  "filled",
  "root_canal",
  "crown",
  "implant",
  "missing",
  "extraction_indicated",
  "impacted",
  "periodontal_issue",
  "other",
];

// validate chart (kiem tra so rang va tinh trang rang)
const validateDentalChart = (teeth = []) => {
  if (!Array.isArray(teeth)) {
    return "Dental chart must be an array";
  }

  const usedTeeth = new Set();
  for (const tooth of teeth) {
    const toothNumber = Number(tooth.tooth_number);
    const condition = tooth.condition_code || tooth.condition || "normal";

    if (!FDI_TEETH.includes(toothNumber)) {
      return `Invalid FDI tooth number: ${tooth.tooth_number}`;
    }
    if (!TOOTH_CONDITIONS.includes(condition)) {
      return `Invalid tooth condition: ${condition}`;
    }
    if (usedTeeth.has(toothNumber)) {
      return `Duplicated tooth number: ${toothNumber}`;
    }
    usedTeeth.add(toothNumber);
  }

  return null;
};

// replace chart (luu lai cac rang cua mot ho so)
const replaceDentalChart = async (recordId, teeth = [], db = pool) => {
  await db.query(
    "DELETE FROM dental_chart_entries WHERE medical_record_id = $1",
    [recordId],
  );

  for (const tooth of teeth) {
    const condition = tooth.condition_code || tooth.condition || "normal";
    await db.query(
      `
        INSERT INTO dental_chart_entries (
          medical_record_id,
          tooth_number,
          condition,
          treatment_note,
          note
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        recordId,
        Number(tooth.tooth_number),
        condition,
        tooth.treatment_note || null,
        tooth.note || null,
      ],
    );
  }
};

// patient chart (lay tinh trang moi nhat cua tung rang)
const getLatestPatientDentalChart = async (patientId) => {
  const result = await pool.query(
    `
      SELECT DISTINCT ON (dce.tooth_number)
        dce.tooth_number,
        dce.condition AS condition_code,
        dce.treatment_note,
        dce.note,
        mr.id AS medical_record_id,
        mr.confirmed_at,
        d.full_name AS dentist_name
      FROM dental_chart_entries dce
      JOIN medical_records mr ON mr.id = dce.medical_record_id
      JOIN dentists d ON d.id = mr.dentist_id
      WHERE mr.patient_id = $1
        AND mr.status = 'Confirmed'
      ORDER BY
        dce.tooth_number,
        COALESCE(mr.confirmed_at, mr.created_at) DESC,
        mr.id DESC
    `,
    [patientId],
  );

  return result.rows;
};

module.exports = {
  FDI_TEETH,
  TOOTH_CONDITIONS,
  validateDentalChart,
  replaceDentalChart,
  getLatestPatientDentalChart,
};
