const express = require("express");
const {
  listDentists,
  listActiveDentists,
  addDentist,
  changeDentistActiveStatus,
} = require("../controllers/dentistController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// dentist routes (danh sach nha si va trang thai hoat dong)
router.get("/active", listActiveDentists);
router.get("/", listDentists);
router.post("/", verifyToken, authorizeRoles("admin"), addDentist);

router.patch(
  "/:dentistId/active-status",
  verifyToken,
  authorizeRoles("admin"),
  changeDentistActiveStatus,
);

module.exports = router;
