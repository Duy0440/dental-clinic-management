BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id INTEGER,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMP,
  dedupe_key VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_notification_type
    CHECK (
      type IN (
        'APPOINTMENT_REQUEST_SUBMITTED',
        'APPOINTMENT_REQUEST_CREATED',
        'APPOINTMENT_CONFIRMED',
        'APPOINTMENT_UPDATED',
        'APPOINTMENT_CANCELLED',
        'DENTIST_APPOINTMENT_ASSIGNED'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

COMMIT;
