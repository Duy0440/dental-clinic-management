BEGIN;

UPDATE medical_records
SET
  status = 'PendingConfirmation',
  updated_at = CURRENT_TIMESTAMP
WHERE status::text = 'Draft';

COMMIT;
