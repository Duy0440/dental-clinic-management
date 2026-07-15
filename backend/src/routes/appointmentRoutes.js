const express = require("express");
const {
  getAppointmentHistory,
  getAppointmentsForAdmin,
  addAppointment,
  cancelAppointment,
  manageAppointment,
  getAppointmentsForDentist,
  getAvailableAppointmentTimes,
} = require("../controllers/appointmentController");
const {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// appointment routes (dat lich, xem lich, admin xu ly lich)
router.get("/", verifyToken, authorizeRoles("admin"), getAppointmentsForAdmin);
router.get("/available-times", getAvailableAppointmentTimes);
router.get("/dentist/my-schedule", verifyToken, authorizeRoles("dentist"), getAppointmentsForDentist);
router.get("/history/:patientId", verifyToken, getAppointmentHistory);
router.post("/", optionalVerifyToken, addAppointment);
router.patch("/:appointmentId/cancel", verifyToken, cancelAppointment);
router.patch(
  "/:appointmentId/admin",
  verifyToken,
  authorizeRoles("admin"),
  manageAppointment,
);


module.exports = router;
