const express = require("express");
const {
  listMedicalRecords,
  getMedicalResultsByPatientId,
  addMedicalRecord,
} = require("../controllers/medicalRecordController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  listMedicalRecords,
);
router.get("/patient/:patientId", verifyToken, getMedicalResultsByPatientId);
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  addMedicalRecord,
);

module.exports = router;
