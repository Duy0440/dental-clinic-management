const bcrypt = require("bcryptjs");
const {
  getAllDentists,
  getActiveDentists,
  createDentist,
  updateDentistActiveStatus,
} = require("../models/dentistModel");
const {
  findUserByUsername,
  createUser,
  updateUserActiveStatus,
} = require("../models/userModel");

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

const listActiveDentists = async (req, res) => {
  try {
    const dentists = await getActiveDentists();

    res.status(200).json({
      message: "Active dentists fetched successfully",
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
    const { full_name, specialty, phone, email, username, password } = req.body;

    if (!full_name || !phone || !username || !password) {
      return res.status(400).json({
        message: "Full name, phone, username and password are required",
      });
    }

    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      username,
      password: hashedPassword,
      role: "dentist",
      phone,
      email,
    });

    const newDentist = await createDentist({
      user_id: newUser.id,
      full_name,
      specialty,
      phone,
      email,
    });

    res.status(201).json({
      message: "Dentist account created successfully",
      data: {
        ...newDentist,
        username: newUser.username,
        user_is_active: newUser.is_active,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const changeDentistActiveStatus = async (req, res) => {
  try {
    const { dentistId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "Active status must be true or false",
      });
    }

    const updatedDentist = await updateDentistActiveStatus(
      dentistId,
      is_active,
    );

    if (!updatedDentist) {
      return res.status(404).json({
        message: "Dentist not found",
      });
    }

    if (updatedDentist.user_id) {
      await updateUserActiveStatus(updatedDentist.user_id, is_active);
    }

    res.status(200).json({
      message: "Dentist active status updated successfully",
      data: updatedDentist,
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
  listActiveDentists,
  addDentist,
  changeDentistActiveStatus,
};
