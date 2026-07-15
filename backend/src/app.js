const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const dentistRoutes = require("./routes/dentistRoutes");
const dentistUnavailableRoutes = require("./routes/dentistUnavailableRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const invoiceDetailRoutes = require("./routes/invoiceDetailRoutes");
const chatbotLogRoutes = require("./routes/chatbotLogRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

// config cors (cho phep frontend goi api)
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// middleware chung
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// health check (kiem tra api con song)
app.get("/", (req, res) => {
  res.json({
    message: "Dental clinic management API is running",
  });
});

// mount routes (gom cac api theo tung nghiep vu)
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/dentist-unavailable-times", dentistUnavailableRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/invoice-details", invoiceDetailRoutes);
app.use("/api/chatbot-logs", chatbotLogRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewRoutes);

module.exports = app;

