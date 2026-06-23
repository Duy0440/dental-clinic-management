# Dental Clinic Management System

## 1. Project overview

This project is a fullstack web application for managing a smart dental clinic.  
The system supports patient management, dentist management, service management, appointment booking, treatment records, invoices, dashboard statistics, and a simple AI chatbot.

## 2. Technologies

- Frontend: ReactJS, Bootstrap 5, Axios, React Router DOM
- Backend: NodeJS, ExpressJS, JWT Authentication, REST API
- Database: MySQL
- AI: Simple chatbot, easy to upgrade to OpenAI API or Gemini API

## 3. Project structure

```bash
dental-clinic-management/
├── frontend/
├── backend/
├── database/
└── README.md
```

## 4. How to run

### Step 1: Create database

- Open MySQL
- Run `database/create_tables.sql`
- Run `database/seed_data.sql`

### Step 2: Run backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### Step 3: Run frontend

```bash
cd frontend
npm install
npm run dev
```

## 5. Main APIs

- `POST /api/auth/register`: register account
- `POST /api/auth/login`: login and get JWT token
- `GET /api/services`: get service list
- `GET /api/patients`: get patient list
- `POST /api/patients`: add new patient
- `GET /api/appointments`: get appointment list
- `POST /api/appointments`: create appointment
- `POST /api/chatbot`: ask dental chatbot

## 6. Why this structure?

- `controllers`: receive request and return response
- `models`: work directly with MySQL
- `routes`: declare API endpoints
- `middlewares`: handle token checking and role checking
- `frontend/pages`: each main page is separated for easy explanation

## 7. Demo accounts

- Admin: `admin@gmail.com`
- Dentist: `dentist@gmail.com`
- Sample password hash is already in seed data. You can replace it with your own account later.
