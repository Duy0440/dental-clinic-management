const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");

const medicalRecordRoutes = require("./routes/medicalRecordRoutes");
const dentistRoutes = require("./routes/dentistRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const invoiceDetailRoutes = require("./routes/invoiceDetailRoutes");
const chatbotLogRoutes = require("./routes/chatbotLogRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Dental clinic management API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/dentists", dentistRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/invoice-details", invoiceDetailRoutes);
app.use("/api/chatbot-logs", chatbotLogRoutes);

module.exports = app;
