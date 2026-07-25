BEGIN;

ALTER TABLE medical_records
  ALTER COLUMN diagnosis DROP NOT NULL,
  ALTER COLUMN treatment DROP NOT NULL;

ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS medical_history TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS clinical_examination TEXT,
  ADD COLUMN IF NOT EXISTS treatment_plan TEXT,
  ADD COLUMN IF NOT EXISTS prescription TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS confirmed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE medical_records
SET status = 'Confirmed',
    updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE status IS NULL;

ALTER TABLE medical_records
  ALTER COLUMN status SET DEFAULT 'PendingConfirmation',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_medical_record_status'
  ) THEN
    ALTER TABLE medical_records
      ADD CONSTRAINT chk_medical_record_status
      CHECK (status IN ('Draft', 'PendingConfirmation', 'Confirmed'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_medical_records_appointment
  ON medical_records (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medical_records_patient
  ON medical_records (patient_id);

CREATE INDEX IF NOT EXISTS idx_medical_records_dentist_status
  ON medical_records (dentist_id, status);

CREATE TABLE IF NOT EXISTS dental_chart_entries (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  tooth_number SMALLINT NOT NULL,
  condition VARCHAR(30) NOT NULL DEFAULT 'normal',
  treatment_note TEXT,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_dental_chart_record_tooth UNIQUE (medical_record_id, tooth_number),
  CONSTRAINT chk_dental_chart_tooth CHECK (
    tooth_number IN (
      18, 17, 16, 15, 14, 13, 12, 11,
      21, 22, 23, 24, 25, 26, 27, 28,
      48, 47, 46, 45, 44, 43, 42, 41,
      31, 32, 33, 34, 35, 36, 37, 38
    )
  ),
  CONSTRAINT chk_dental_chart_condition CHECK (
    condition IN (
      'normal',
      'caries',
      'filled',
      'root_canal',
      'crown',
      'implant',
      'missing',
      'extraction_indicated',
      'impacted',
      'periodontal_issue',
      'other'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_dental_chart_record
  ON dental_chart_entries (medical_record_id);

CREATE TABLE IF NOT EXISTS medical_record_audit_logs (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  action VARCHAR(40) NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_medical_record_audit_action CHECK (
    action IN (
      'CREATED',
      'UPDATED',
      'SUBMITTED_FOR_CONFIRMATION',
      'CONFIRMED',
      'ATTACHMENT_UPLOADED'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_medical_record_audit_record
  ON medical_record_audit_logs (medical_record_id, created_at DESC);

COMMIT;
