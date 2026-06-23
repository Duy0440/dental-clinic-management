const express = require("express");
const {
  listDentists,
  addDentist,
} = require("../controllers/dentistController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", listDentists);
router.post("/", verifyToken, authorizeRoles("admin"), addDentist);

module.exports = router;
