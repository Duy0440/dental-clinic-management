const {
  getAllDentists,
  createDentist,
  findDentistByUserId,
} = require("../models/dentistModel");

const listDentists = async (req, res) => {
  try {
    const dentists = await getAllDentists();

    res.status(200).json({
      message: "Dentists fetched successfully",
      data: dentists,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const addDentist = async (req, res) => {
  try {
    const { user_id, full_name, specialty, phone } = req.body;

    if (!user_id || !full_name || !phone) {
      return res.status(400).json({
        message: "User ID, full name and phone are required",
      });
    }

    const existingDentist = await findDentistByUserId(user_id);

    if (existingDentist) {
      return res.status(409).json({
        message: "This user already has a dentist profile",
      });
    }

    const newDentist = await createDentist({
      user_id,
      full_name,
      specialty,
      phone,
    });

    res.status(201).json({
      message: "Dentist created successfully",
      data: newDentist,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listDentists,
  addDentist,
};
