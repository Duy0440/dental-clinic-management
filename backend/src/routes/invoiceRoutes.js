const express = require("express");
const {
  listInvoices,
  listMyInvoices,
  getInvoiceDetail,
  addInvoice,
  addInvoicePayment,
  cancelInvoice,
  exportInvoice,
} = require("../controllers/invoiceController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// payment routes (giu URL invoices de tranh anh huong code cu)
router.get("/", verifyToken, authorizeRoles("admin"), listInvoices);
router.get("/my", verifyToken, authorizeRoles("customer"), listMyInvoices);
router.get("/:invoiceId/export", verifyToken, authorizeRoles("admin", "customer"), exportInvoice);
router.get("/:invoiceId", verifyToken, authorizeRoles("admin", "customer"), getInvoiceDetail);
router.post("/", verifyToken, authorizeRoles("admin"), addInvoice);
router.post("/:invoiceId/payments", verifyToken, authorizeRoles("admin"), addInvoicePayment);
router.patch("/:invoiceId/cancel", verifyToken, authorizeRoles("admin"), cancelInvoice);

module.exports = router;
