const express = require("express");
const {
  listUnavailableTimes,
  listRecentUnavailableTimes,
  addUnavailableTime,
} = require("../controllers/dentistUnavailableController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/recent",
  verifyToken,
  authorizeRoles("admin"),
  listRecentUnavailableTimes,
);

router.get(
  "/dentist/:dentistId",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  listUnavailableTimes,
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "dentist"),
  addUnavailableTime,
);

module.exports = router;
