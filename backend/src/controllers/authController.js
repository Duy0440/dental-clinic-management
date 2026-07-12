const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findUserByUsername,
  createUser,
  updateUserPasswordById,
} = require("../models/userModel");
const {
  createPatient,
  findPatientByUserId,
} = require("../models/patientModel");
const { findDentistByUserId } = require("../models/dentistModel");

// auth register (dky tai khoan khach)
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

// auth login (đăng nhập và cấp token JWT)
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

    if (!user.is_active) {
      return res.status(403).json({
        message: "This account has been disabled",
      });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    const patientProfile = await findPatientByUserId(user.id);
    const dentistProfile =
      user.role === "dentist" ? await findDentistByUserId(user.id) : null;

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
        dentist_id: dentistProfile ? dentistProfile.id : null,
        dentist_name: dentistProfile ? dentistProfile.full_name : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");

// reset password (đổi mật khẩu bằng sdt)
const forgotPassword = async (req, res) => {
  try {
    const { username, phone, new_password } = req.body;

    if (!username || !phone || !new_password) {
      return res.status(400).json({
        message: "Username, phone and new password are required",
      });
    }

    if (String(new_password).length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const user = await findUserByUsername(username);

    if (!user || !user.is_active) {
      return res.status(404).json({
        message: "Account not found or has been disabled",
      });
    }

    if (normalizePhone(user.phone) !== normalizePhone(phone)) {
      return res.status(400).json({
        message: "Phone number does not match this account",
      });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await updateUserPasswordById(user.id, hashedPassword);

    res.status(200).json({
      message: "Password reset successful",
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
  forgotPassword,
};
