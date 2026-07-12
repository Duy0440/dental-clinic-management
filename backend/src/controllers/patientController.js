const bcrypt = require("bcryptjs");
const {
  getAllPatients,
  createPatient,
  findPatientByUserId,
  findPatientById,
  updatePatientUserId,
} = require("../models/patientModel");
const { findUserByUsername, createUser } = require("../models/userModel");

// patient list (danh sách khách hàng)
const listPatients = async (req, res) => {
  try {
    const patients = await getAllPatients();

    res.status(200).json({
      message: "Patients fetched successfully",
      data: patients,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// create patient (tạo hồ sơ khách hàng)
const addPatient = async (req, res) => {
  try {
    const { user_id, full_name, phone, gender, birth_date, address } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({
        message: "Full name and phone are required",
      });
    }

    if (user_id) {
      const existingPatient = await findPatientByUserId(user_id);

      if (existingPatient) {
        return res.status(409).json({
          message: "This user already has a patient profile",
        });
      }
    }

    const newPatient = await createPatient({
      user_id,
      full_name,
      phone,
      gender,
      birth_date,
      address,
    });

    res.status(201).json({
      message: "Patient created successfully",
      data: newPatient,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// patient detail (chi tiết khách hàng)
const getPatientDetail = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await findPatientById(patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.status(200).json({
      message: "Customer fetched successfully",
      data: patient,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// create account (tạo tài khoản cho khách)
const createAccountForPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const patient = await findPatientById(patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (patient.user_id) {
      return res.status(409).json({
        message: "Customer already has an account",
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
      role: "customer",
      phone: patient.phone,
      email,
    });

    const updatedPatient = await updatePatientUserId(patient.id, newUser.id);

    res.status(201).json({
      message: "Customer account created successfully",
      data: {
        user: newUser,
        patient: updatedPatient,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listPatients,
  addPatient,
  getPatientDetail,
  createAccountForPatient,
};
