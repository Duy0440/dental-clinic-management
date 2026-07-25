const express = require("express");
const {
  listMedicalRecords,
  getMedicalRecordDetail,
  getMedicalResultsByPatientId,
  getPatientDentalChart,
  addMedicalRecord,
  editMedicalRecord,
  submitMedicalRecord,
  confirmMedicalRecord,
  getMedicalRecordAudit,
  uploadMedicalRecordAttachment,
} = require("../controllers/medicalRecordController");

const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const uploadMedicalFile = require("../middlewares/uploadMiddleware");
const router = express.Router();

// medical record routes (benh an, so do rang va file dinh kem)
router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  listMedicalRecords,
);
router.get("/patient/:patientId/dental-chart", verifyToken, getPatientDentalChart);
router.get("/patient/:patientId", verifyToken, getMedicalResultsByPatientId);
router.get(
  "/:id/audit-logs",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  getMedicalRecordAudit,
);
router.get("/:id", verifyToken, getMedicalRecordDetail);
router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  addMedicalRecord,
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  editMedicalRecord,
);
router.post(
  "/:id/submit",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  submitMedicalRecord,
);
router.post(
  "/:id/confirm",
  verifyToken,
  authorizeRoles("dentist"),
  confirmMedicalRecord,
);

router.post(
  "/:recordId/attachments",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  uploadMedicalFile.single("file"),
  uploadMedicalRecordAttachment,
);

module.exports = router;
