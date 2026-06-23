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

router.get("/", verifyToken, authorizeRoles("admin"), listInvoiceDetails);
router.post("/", verifyToken, authorizeRoles("admin"), addInvoiceDetail);

module.exports = router;
