BEGIN;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(14, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_reason TEXT,
  ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE invoices
  ALTER COLUMN subtotal TYPE NUMERIC(14, 2),
  ALTER COLUMN discount_amount TYPE NUMERIC(14, 2),
  ALTER COLUMN total_amount TYPE NUMERIC(14, 2),
  ALTER COLUMN paid_amount TYPE NUMERIC(14, 2),
  ALTER COLUMN remaining_amount TYPE NUMERIC(14, 2);

UPDATE invoices
SET
  subtotal = COALESCE(subtotal, total_amount, 0),
  discount_amount = COALESCE(discount_amount, 0),
  total_amount = GREATEST(COALESCE(total_amount, subtotal, 0), COALESCE(paid_amount, 0), 0),
  paid_amount = GREATEST(COALESCE(paid_amount, 0), 0),
  remaining_amount = GREATEST(COALESCE(remaining_amount, total_amount - paid_amount, 0), 0),
  updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

UPDATE invoices
SET
  remaining_amount = GREATEST(total_amount - paid_amount, 0),
  updated_at = CURRENT_TIMESTAMP
WHERE payment_status IS DISTINCT FROM 'Cancelled';

UPDATE invoices
SET payment_status = 'PartiallyPaid'
WHERE payment_status = 'Partial';

UPDATE invoices
SET payment_status = CASE
  WHEN payment_status = 'Cancelled' THEN 'Cancelled'
  WHEN COALESCE(paid_amount, 0) <= 0 THEN 'Unpaid'
  WHEN COALESCE(paid_amount, 0) >= COALESCE(total_amount, 0) THEN 'Paid'
  ELSE 'PartiallyPaid'
END
WHERE payment_status IS NULL
  OR payment_status NOT IN ('Unpaid', 'PartiallyPaid', 'Paid', 'Cancelled')
  OR payment_status <> CASE
    WHEN payment_status = 'Cancelled' THEN 'Cancelled'
    WHEN COALESCE(paid_amount, 0) <= 0 THEN 'Unpaid'
    WHEN COALESCE(paid_amount, 0) >= COALESCE(total_amount, 0) THEN 'Paid'
    ELSE 'PartiallyPaid'
  END;

DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'invoices'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%payment_status%'
  LOOP
    EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE invoices
  ALTER COLUMN subtotal SET DEFAULT 0,
  ALTER COLUMN subtotal SET NOT NULL,
  ALTER COLUMN discount_amount SET DEFAULT 0,
  ALTER COLUMN discount_amount SET NOT NULL,
  ALTER COLUMN total_amount SET DEFAULT 0,
  ALTER COLUMN total_amount SET NOT NULL,
  ALTER COLUMN paid_amount SET DEFAULT 0,
  ALTER COLUMN paid_amount SET NOT NULL,
  ALTER COLUMN remaining_amount SET DEFAULT 0,
  ALTER COLUMN remaining_amount SET NOT NULL,
  ALTER COLUMN payment_status SET DEFAULT 'Unpaid',
  ALTER COLUMN payment_status SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_payment_status
  CHECK (payment_status IN ('Unpaid', 'PartiallyPaid', 'Paid', 'Cancelled'));

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS chk_invoices_amounts;

ALTER TABLE invoices
  ADD CONSTRAINT chk_invoices_amounts
  CHECK (
    subtotal >= 0
    AND discount_amount >= 0
    AND discount_amount <= subtotal
    AND total_amount >= 0
    AND paid_amount >= 0
    AND paid_amount <= total_amount
    AND remaining_amount >= 0
  );

ALTER TABLE invoice_details
  ADD COLUMN IF NOT EXISTS treatment_group TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE invoice_details
  ALTER COLUMN unit_price TYPE NUMERIC(14, 2),
  ALTER COLUMN discount_amount TYPE NUMERIC(14, 2),
  ALTER COLUMN subtotal TYPE NUMERIC(14, 2);

UPDATE invoice_details
SET
  discount_amount = COALESCE(discount_amount, 0),
  subtotal = GREATEST(COALESCE(subtotal, quantity * unit_price, 0), 0),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(40) NOT NULL CHECK (payment_method IN ('Tiền mặt', 'Chuyển khoản')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  note TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice
  ON payments (invoice_id, payment_date, id);

CREATE INDEX IF NOT EXISTS idx_invoices_patient_status
  ON invoices (patient_id, payment_status);

INSERT INTO payments (
  invoice_id,
  amount,
  payment_method,
  payment_date,
  appointment_id,
  note,
  created_by_user_id,
  created_at
)
SELECT
  i.id,
  i.paid_amount,
  CASE
    WHEN i.payment_method IN ('Tiền mặt', 'Chuyển khoản') THEN i.payment_method
    WHEN LOWER(COALESCE(i.payment_method, '')) IN ('bank', 'banktransfer', 'bank_transfer', 'transfer', 'chuyen khoan') THEN 'Chuyển khoản'
    ELSE 'Tiền mặt'
  END,
  i.created_at::date,
  i.appointment_id,
  'Backfill từ dữ liệu hóa đơn cũ',
  i.issued_by,
  i.created_at
FROM invoices i
WHERE i.paid_amount > 0
  AND NOT EXISTS (
    SELECT 1
    FROM payments p
    WHERE p.invoice_id = i.id
  );

COMMIT;
