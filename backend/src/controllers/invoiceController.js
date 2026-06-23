const {
  getAllInvoices,
  createInvoice,
  checkInvoiceReferences,
  findInvoiceByCode,
} = require("../models/invoiceModel");

const VALID_PAYMENT_STATUSES = ["Unpaid", "Paid"];

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

const addInvoice = async (req, res) => {
  try {
    const {
      patient_id,
      appointment_id,
      invoice_code,
      total_amount,
      payment_status,
      payment_method,
      issued_by,
    } = req.body;

    if (!patient_id || !invoice_code || total_amount === undefined) {
      return res.status(400).json({
        message: "Patient ID, invoice code and total amount are required",
      });
    }

    const normalizedStatus = payment_status || "Unpaid";

    if (!VALID_PAYMENT_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const existingInvoice = await findInvoiceByCode(invoice_code);

    if (existingInvoice) {
      return res.status(409).json({
        message: "Invoice code already exists",
      });
    }

    const { patientExists, appointmentExists } =
      await checkInvoiceReferences(patient_id, appointment_id);

    if (!patientExists) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    if (!appointmentExists) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const newInvoice = await createInvoice({
      patient_id,
      appointment_id,
      invoice_code,
      total_amount,
      payment_status: normalizedStatus,
      payment_method,
      issued_by,
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

module.exports = {
  listInvoices,
  addInvoice,
};