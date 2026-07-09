const {
  getActiveServices,
  getAllServicesForAdmin,
  createService,
  updateServiceById,
  deactivateServiceById,
} = require("../models/serviceModel");

const listServices = async (req, res) => {
  try {
    const services = await getActiveServices();

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

const listServicesForAdmin = async (req, res) => {
  try {
    const services = await getAllServicesForAdmin();

    res.status(200).json({
      message: "Admin services fetched successfully",
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
    const { service_name, description, is_active } = req.body;

    if (!service_name) {
      return res.status(400).json({
        message: "Service name is required",
      });
    }

    const newService = await createService({
      service_name,
      description,
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

const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { service_name, description, is_active } = req.body;

    if (!service_name) {
      return res.status(400).json({
        message: "Service name is required",
      });
    }

    const updatedService = await updateServiceById(serviceId, {
      service_name,
      description,
      is_active,
    });

    if (!updatedService) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(200).json({
      message: "Service updated successfully",
      data: updatedService,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const deactivatedService = await deactivateServiceById(serviceId);

    if (!deactivatedService) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    res.status(200).json({
      message: "Service deactivated successfully",
      data: deactivatedService,
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
  listServicesForAdmin,
  addService,
  updateService,
  deleteService,
};