const express = require("express");
const {
  listServices,
  addService,
} = require("../controllers/serviceController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", listServices);
router.post("/", verifyToken, authorizeRoles("admin"), addService);

module.exports = router;
