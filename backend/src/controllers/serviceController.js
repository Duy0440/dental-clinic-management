const {
  getActiveServices,
  getAllServicesForAdmin,
  createService,
  updateServiceById,
  deactivateServiceById,
} = require("../models/serviceModel");

// active services (dịch vụ đang hoạt động)
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

// service admin list (danh sách dịch vụ cho admin)
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

// create service (thêm dịch vụ)
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

// update service (sửa dịch vụ)
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

// soft delete (ẩn dịch vụ, không xóa khỏi DB)
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
