-- Admin login:
--   username: admin01
--   password: 123456

DROP TABLE IF EXISTS medical_record_audit_logs CASCADE;
DROP TABLE IF EXISTS dental_chart_entries CASCADE;
DROP TABLE IF EXISTS medical_record_attachments CASCADE;
DROP TABLE IF EXISTS dentist_unavailable_times CASCADE;
DROP TABLE IF EXISTS invoice_details CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS chatbot_logs CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS dentists CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS page_visits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('admin', 'dentist', 'customer')),
  phone VARCHAR(20),
  email VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  gender VARCHAR(20),
  birth_date DATE,
  address VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dentists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(120) NOT NULL,
  specialty VARCHAR(120),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(150) NOT NULL,
  price NUMERIC(12, 2),
  description TEXT,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id INTEGER REFERENCES dentists(id) ON DELETE SET NULL,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
  booking_source VARCHAR(30)
    CHECK (booking_source IS NULL OR booking_source IN ('website', 'customer', 'admin')),
  note TEXT,
  clinic_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id INTEGER NOT NULL REFERENCES dentists(id) ON DELETE RESTRICT,
  chief_complaint TEXT,
  medical_history TEXT,
  allergies TEXT,
  clinical_examination TEXT,
  diagnosis TEXT,
  treatment TEXT,
  treatment_plan TEXT,
  prescription TEXT,
  note TEXT,
  re_examination_date DATE,
  re_examination_time TIME,
  attachment_url TEXT,
  entered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PendingConfirmation'
    CONSTRAINT chk_medical_record_status
    CHECK (status IN ('Draft', 'PendingConfirmation', 'Confirmed')),
  confirmed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_medical_records_appointment
  ON medical_records (appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX idx_medical_records_patient
  ON medical_records (patient_id);

CREATE INDEX idx_medical_records_dentist_status
  ON medical_records (dentist_id, status);

CREATE TABLE medical_record_attachments (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(80),
  uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dental_chart_entries (
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
      'normal', 'caries', 'filled', 'root_canal', 'crown', 'implant',
      'missing', 'extraction_indicated', 'impacted', 'periodontal_issue', 'other'
    )
  )
);

CREATE INDEX idx_dental_chart_record
  ON dental_chart_entries (medical_record_id);

CREATE TABLE medical_record_audit_logs (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  action VARCHAR(40) NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_medical_record_audit_action CHECK (
    action IN (
      'CREATED', 'UPDATED', 'SUBMITTED_FOR_CONFIRMATION',
      'CONFIRMED', 'ATTACHMENT_UPLOADED'
    )
  )
);

CREATE INDEX idx_medical_record_audit_record
  ON medical_record_audit_logs (medical_record_id, created_at DESC);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_code VARCHAR(40) NOT NULL UNIQUE,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_reason TEXT,
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'PartiallyPaid', 'Paid', 'Cancelled')),
  payment_method VARCHAR(40),
  cancelled_at TIMESTAMP,
  cancelled_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    subtotal >= 0
    AND discount_amount >= 0
    AND discount_amount <= subtotal
    AND total_amount >= 0
    AND paid_amount >= 0
    AND paid_amount <= total_amount
    AND remaining_amount >= 0
  )
);

CREATE TABLE invoice_details (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  treatment_group TEXT,
  custom_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (service_id IS NOT NULL OR custom_description IS NOT NULL)
);

CREATE TABLE payments (
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

CREATE INDEX idx_payments_invoice
  ON payments (invoice_id, payment_date, id);

CREATE INDEX idx_invoices_patient_status
  ON invoices (patient_id, payment_status);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chatbot_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dentist_unavailable_times (
  id SERIAL PRIMARY KEY,
  dentist_id INTEGER NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    start_time IS NULL
    OR end_time IS NULL
    OR start_time < end_time
  )
);

CREATE TABLE page_visits (
  id SERIAL PRIMARY KEY,
  page_path VARCHAR(255) NOT NULL DEFAULT '/',
  user_agent TEXT,
  ip_address VARCHAR(80),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_dentists_active ON dentists(is_active);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_dentist ON appointments(dentist_id);
CREATE INDEX idx_appointments_booking_source ON appointments(booking_source, appointment_date);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_chatbot_logs_user ON chatbot_logs(user_id);
CREATE INDEX idx_page_visits_created_at ON page_visits(created_at);

INSERT INTO users (username, password, role, phone, email, is_active)
VALUES (
  'admin01',
  '$2a$10$rv2/.A/f67zPSeqEMVRJ0OTWxDgCXvlrlckq4J19eZxJLsEV7zXee',
  'admin',
  '0901000001',
  'admin@clinic.com',
  TRUE
);

-- Verification: admin_count should be 1 and business tables should be empty.
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admin_count,
  (SELECT COUNT(*) FROM patients) AS patient_count,
  (SELECT COUNT(*) FROM dentists) AS dentist_count,
  (SELECT COUNT(*) FROM services) AS service_count,
  (SELECT COUNT(*) FROM appointments) AS appointment_count,
  (SELECT COUNT(*) FROM invoices) AS invoice_count,
  (SELECT COUNT(*) FROM reviews) AS review_count,
  (SELECT COUNT(*) FROM chatbot_logs) AS chatbot_log_count;
