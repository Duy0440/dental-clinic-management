const {
  getUnavailableTimesByDentistId,
  getRecentUnavailableTimes,
  createUnavailableTime,
} = require("../models/dentistUnavailableModel");
const { findDentistByUserId } = require("../models/dentistModel");

// unavailable list (xem lịch bận của nha sĩ)
const listUnavailableTimes = async (req, res) => {
  try {
    const { dentistId } = req.params;

    const unavailableTimes = await getUnavailableTimesByDentistId(dentistId);

    res.status(200).json({
      message: "Unavailable times fetched successfully",
      data: unavailableTimes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// recent unavailable (lịch bận mới nhất)
const listRecentUnavailableTimes = async (req, res) => {
  try {
    const unavailableTimes = await getRecentUnavailableTimes(6);

    res.status(200).json({
      message: "Recent unavailable times fetched successfully",
      data: unavailableTimes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// create unavailable (tạo lịch bận/nghỉ)
const addUnavailableTime = async (req, res) => {
  try {
    const { dentist_id, unavailable_date, start_time, end_time, reason } =
      req.body;

    if (!unavailable_date) {
      return res.status(400).json({
        message: "Unavailable date is required",
      });
    }

    if ((start_time && !end_time) || (!start_time && end_time)) {
      return res.status(400).json({
        message: "Start time and end time must be provided together",
      });
    }

    let finalDentistId = dentist_id;

    if (req.user.role === "dentist") {
      const dentistProfile = await findDentistByUserId(req.user.id);

      if (!dentistProfile) {
        return res.status(404).json({
          message: "Dentist profile not found",
        });
      }

      finalDentistId = dentistProfile.id;
    }

    if (!finalDentistId) {
      return res.status(400).json({
        message: "Dentist ID is required",
      });
    }

    const unavailableTime = await createUnavailableTime({
      dentist_id: finalDentistId,
      unavailable_date,
      start_time,
      end_time,
      reason,
      created_by_user_id: req.user.id,
    });

    res.status(201).json({
      message: "Unavailable time created successfully",
      data: unavailableTime,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listUnavailableTimes,
  listRecentUnavailableTimes,
  addUnavailableTime,
};
