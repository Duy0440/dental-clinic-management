const express = require("express");
const {
  listPatients,
  addPatient,
  getPatientDetail,
  getMyPatientProfile,
  createAccountForPatient,
} = require("../controllers/patientController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// patient routes (ho so khach hang va tao tai khoan)
router.get("/", verifyToken, authorizeRoles("admin", "dentist"), listPatients);
router.get("/me", verifyToken, authorizeRoles("customer"), getMyPatientProfile);

router.get(
  "/:patientId",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  getPatientDetail,
);

router.post("/", verifyToken, authorizeRoles("admin"), addPatient);
router.post(
  "/:patientId/create-account",
  verifyToken,
  authorizeRoles("admin"),
  createAccountForPatient,
);

module.exports = router;
