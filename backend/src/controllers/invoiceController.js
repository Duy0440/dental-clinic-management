const {
  getAllInvoices,
  findInvoiceByCode,
  checkInvoiceReferences,
  createInvoiceWithDetails,
  deleteInvoiceById,
} = require("../models/invoiceModel");

const VALID_PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản"];

// invoice list (danh sách hóa đơn)
const listInvoices = async (req, res) => {
  try {
    const invoices = await getAllInvoices();

    res.status(200).json({
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// create invoice (lập hóa đơn kèm chi tiết)
const addInvoice = async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      invoice_code,
      payment_method,
      details,
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({
        message: "Customer is required",
      });
    }

    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        message: "Payment method is invalid",
      });
    }

    if (!Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        message: "Invoice must have at least one detail",
      });
    }

    let totalAmount = 0;

    for (const detail of details) {
      const hasService = Boolean(detail.service_id);
      const hasDescription = Boolean(detail.custom_description?.trim());
      const quantity = Number(detail.quantity || 0);
      const unitPrice = Number(detail.unit_price || 0);
      const discountAmount = Number(detail.discount_amount || 0);

      if (!hasService && !hasDescription) {
        return res.status(400).json({
          message: "Each invoice detail must have service or description",
        });
      }

      if (quantity <= 0 || unitPrice <= 0 || discountAmount < 0) {
        return res.status(400).json({
          message: "Invalid quantity, price or discount",
        });
      }

      totalAmount += Math.max(quantity * unitPrice - discountAmount, 0);
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: "Invoice total must be greater than 0",
      });
    }

    const finalInvoiceCode = invoice_code || `HD${Date.now()}`;
    const existingInvoice = await findInvoiceByCode(finalInvoiceCode);

    if (existingInvoice) {
      return res.status(409).json({
        message: "Invoice code already exists",
      });
    }

    const { patientExists, appointmentExists } =
      await checkInvoiceReferences(patient_id, appointment_id);

    if (!patientExists) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (!appointmentExists) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const newInvoice = await createInvoiceWithDetails({
      patient_id,
      appointment_id,
      invoice_code: finalInvoiceCode,
      payment_method,
      issued_by: req.user.id,
      details,
    });

    res.status(201).json({
      message: "Invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// delete invoice (xóa hóa đơn)
const removeInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const deletedInvoice = await deleteInvoiceById(invoiceId);

    if (!deletedInvoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listInvoices,
  addInvoice,
  removeInvoice,
};
