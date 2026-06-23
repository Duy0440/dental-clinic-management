const {
  getAllInvoiceDetails,
  createInvoiceDetail,
  checkInvoiceDetailReferences,
} = require("../models/invoiceDetailModel");

const listInvoiceDetails = async (req, res) => {
  try {
    const details = await getAllInvoiceDetails();

    res.status(200).json({
      message: "Invoice details fetched successfully",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addInvoiceDetail = async (req, res) => {
  try {
    const {
      invoice_id,
      service_id,
      quantity,
      unit_price,
      discount_amount,
      subtotal,
    } = req.body;

    if (
      !invoice_id ||
      !service_id ||
      unit_price === undefined ||
      subtotal === undefined
    ) {
      return res.status(400).json({
        message: "Invoice ID, service ID, unit price and subtotal are required",
      });
    }

    const { invoiceExists, serviceExists } = await checkInvoiceDetailReferences(
      invoice_id,
      service_id,
    );

    if (!invoiceExists) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (!serviceExists) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const newDetail = await createInvoiceDetail({
      invoice_id,
      service_id,
      quantity,
      unit_price,
      discount_amount,
      subtotal,
    });

    res.status(201).json({
      message: "Invoice detail created successfully",
      data: newDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listInvoiceDetails,
  addInvoiceDetail,
};
