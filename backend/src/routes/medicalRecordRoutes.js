const express = require("express");
const {
  listMedicalRecords,
  getMedicalResultsByPatientId,
  addMedicalRecord,
  uploadMedicalRecordAttachment,
} = require("../controllers/medicalRecordController");

const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const uploadMedicalFile = require("../middlewares/uploadMiddleware");
const router = express.Router();

// medical record routes (ket qua dieu tri va file dinh kem)
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

router.post(
  "/:recordId/attachments",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  uploadMedicalFile.single("file"),
  uploadMedicalRecordAttachment,
);

module.exports = router;
