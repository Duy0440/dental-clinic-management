const express = require("express");
const {
  savePageVisit,
  getSummary,
} = require("../controllers/dashboardController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// dashboard routes (luot truy cap va thong ke tong quan)
router.post("/visit", savePageVisit);
router.get("/summary", verifyToken, authorizeRoles("admin"), getSummary);

module.exports = router;
