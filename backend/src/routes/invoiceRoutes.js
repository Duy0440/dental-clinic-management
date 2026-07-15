const express = require("express");
const {
  listInvoices,
  addInvoice,
  removeInvoice,
} = require("../controllers/invoiceController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// invoice routes (lap hoa don va quan ly hoa don)
router.get("/", verifyToken, authorizeRoles("admin"), listInvoices);
router.post("/", verifyToken, authorizeRoles("admin"), addInvoice);
router.delete("/:invoiceId", verifyToken, authorizeRoles("admin"), removeInvoice);

module.exports = router;
