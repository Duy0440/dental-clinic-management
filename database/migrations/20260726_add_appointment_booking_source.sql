BEGIN;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS booking_source VARCHAR(30);

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS chk_appointments_booking_source;

ALTER TABLE appointments
  ADD CONSTRAINT chk_appointments_booking_source
  CHECK (
    booking_source IS NULL
    OR booking_source IN ('website', 'customer', 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_appointments_booking_source
  ON appointments (booking_source, appointment_date);

COMMIT;
