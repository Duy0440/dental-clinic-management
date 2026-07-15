-- Admin login:
--   username: admin01
--   password: 123456

DROP TABLE IF EXISTS medical_record_attachments CASCADE;
DROP TABLE IF EXISTS dentist_unavailable_times CASCADE;
DROP TABLE IF EXISTS invoice_details CASCADE;
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
  note TEXT,
  clinic_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_records (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id INTEGER NOT NULL REFERENCES dentists(id) ON DELETE RESTRICT,
  diagnosis TEXT NOT NULL,
  treatment TEXT NOT NULL,
  note TEXT,
  re_examination_date DATE,
  re_examination_time TIME,
  attachment_url TEXT,
  entered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_record_attachments (
  id SERIAL PRIMARY KEY,
  medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(80),
  uploaded_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
  invoice_code VARCHAR(40) NOT NULL UNIQUE,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid'
    CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid', 'Cancelled')),
  payment_method VARCHAR(40),
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_details (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
  custom_description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  CHECK (service_id IS NOT NULL OR custom_description IS NOT NULL)
);

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
