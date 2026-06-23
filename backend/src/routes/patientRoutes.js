const express = require("express");
const {
  listPatients,
  addPatient,
  getPatientDetail,
} = require("../controllers/patientController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("admin", "dentist"), listPatients);

router.get(
  "/:patientId",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  getPatientDetail,
);

router.post("/", verifyToken, authorizeRoles("admin"), addPatient);

module.exports = router;
