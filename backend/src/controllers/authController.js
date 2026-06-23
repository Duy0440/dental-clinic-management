const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByUsername, createUser } = require("../models/userModel");
const {
  createPatient,
  findPatientByUserId,
} = require("../models/patientModel");

const register = async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      phone,
      email,
      full_name,
      gender,
      birth_date,
      address,
    } = req.body;

    const normalizedRole = role || "customer";

    if (!username || !password || !phone) {
      return res.status(400).json({
        message: "Username, password and phone are required",
      });
    }

    if (normalizedRole === "customer" && !full_name) {
      return res.status(400).json({
        message: "Full name is required for customer registration",
      });
    }

    const existingUser = await findUserByUsername(username);

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      username,
      password: hashedPassword,
      role: normalizedRole,
      phone,
      email,
    });

    let patientProfile = null;

    if (normalizedRole === "customer") {
      patientProfile = await createPatient({
        user_id: newUser.id,
        full_name,
        phone,
        gender,
        birth_date,
        address,
      });
    }

    res.status(201).json({
      message: "Register successful",
      data: {
        user: newUser,
        patient_profile: patientProfile,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await findUserByUsername(username);

    if (!user) {
      return res.status(400).json({
        message: "Username does not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    const patientProfile = await findPatientByUserId(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        phone: user.phone,
        email: user.email,
        patient_id: patientProfile ? patientProfile.id : null,
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
  register,
  login,
};
