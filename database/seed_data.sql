USE dental_clinic_management;

INSERT INTO users (full_name, email, password, role) VALUES
(''Admin User'', ''admin@gmail.com'', ''$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'', ''admin''),
(''Dentist User'', ''dentist@gmail.com'', ''$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'', ''dentist'');

INSERT INTO patients (full_name, phone, gender, birth_date, address) VALUES
(''Nguyen Van A'', ''0901234567'', ''Nam'', ''2001-05-12'', ''Ho Chi Minh City''),
(''Tran Thi B'', ''0912345678'', ''Nu'', ''1999-09-20'', ''Da Nang'');

INSERT INTO dentists (full_name, specialty, phone, email) VALUES
(''Dr. Le Minh'', ''Nieng rang'', ''0934567890'', ''leminh@gmail.com''),
(''Dr. Pham Hoa'', ''Nho rang'', ''0945678901'', ''phamhoa@gmail.com'');

INSERT INTO services (service_name, price, description) VALUES
(''Nho rang'', 500000, ''Dich vu nho rang an toan va nhanh chong''),
(''Cao voi rang'', 300000, ''Lam sach cao voi rang dinh ky''),
(''Tram rang'', 400000, ''Dieu tri sau rang bang phuong phap tram rang'');

INSERT INTO appointments (patient_id, dentist_id, service_id, appointment_date, appointment_time, status) VALUES
(1, 1, 1, ''2026-06-10'', ''09:00:00'', ''Confirmed''),
(2, 2, 2, ''2026-06-11'', ''14:30:00'', ''Pending'');
