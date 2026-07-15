const express = require("express");
const {
  listInvoiceDetails,
  addInvoiceDetail,
} = require("../controllers/invoiceDetailController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// invoice detail routes (chi tiet dich vu trong hoa don)
router.get("/", verifyToken, authorizeRoles("admin"), listInvoiceDetails);
router.post("/", verifyToken, authorizeRoles("admin"), addInvoiceDetail);

module.exports = router;
