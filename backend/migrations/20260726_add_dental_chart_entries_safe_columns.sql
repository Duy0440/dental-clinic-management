CREATE TABLE IF NOT EXISTS dental_chart_entries (
  id BIGSERIAL PRIMARY KEY,
  medical_record_id BIGINT NOT NULL,
  patient_id BIGINT,
  tooth_number INTEGER NOT NULL,
  condition TEXT,
  condition_code TEXT,
  treatment_note TEXT,
  note TEXT,
  created_by_user_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS patient_id BIGINT;

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS condition TEXT;

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS condition_code TEXT;

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE dental_chart_entries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE dental_chart_entries
SET condition_code = condition
WHERE condition_code IS NULL
  AND condition IS NOT NULL;

UPDATE dental_chart_entries
SET condition = condition_code
WHERE condition IS NULL
  AND condition_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dental_chart_entries_record_id
  ON dental_chart_entries (medical_record_id);

CREATE INDEX IF NOT EXISTS idx_dental_chart_entries_patient_id
  ON dental_chart_entries (patient_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dental_chart_entries_record_tooth
  ON dental_chart_entries (medical_record_id, tooth_number);
