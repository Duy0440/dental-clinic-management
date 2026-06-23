const { getAllServices, createService } = require("../models/serviceModel");

const listServices = async (req, res) => {
  try {
    const services = await getAllServices();

    res.status(200).json({
      message: "Services fetched successfully",
      data: services,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addService = async (req, res) => {
  try {
    const { service_name, price, description, duration_minutes, is_active } =
      req.body;

    if (!service_name || !price) {
      return res.status(400).json({
        message: "Service name and price are required",
      });
    }

    const newService = await createService({
      service_name,
      price,
      description,
      duration_minutes,
      is_active,
    });

    res.status(201).json({
      message: "Service created successfully",
      data: newService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listServices,
  addService,
};
