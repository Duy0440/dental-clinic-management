const {
  getAllPatients,
  createPatient,
  findPatientByUserId,
  findPatientById,
} = require("../models/patientModel");

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

module.exports = {
  listPatients,
  addPatient,
  getPatientDetail,
};
