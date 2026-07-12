const {
  getAllReviews,
  getReviewsByPatientId,
  findExistingReview,
  checkCompletedAppointmentForReview,
  createReview,
} = require("../models/reviewModel");
const { findPatientByUserId } = require("../models/patientModel");

// review list (danh sách đánh giá)
const listReviews = async (req, res) => {
  try {
    const reviews = await getAllReviews();

    res.status(200).json({
      message: "Reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// my reviews (đánh giá của khách)
const listMyReviews = async (req, res) => {
  try {
    const patientProfile = await findPatientByUserId(req.user.id);

    if (!patientProfile) {
      return res.status(400).json({
        message: "Patient profile is required",
      });
    }

    const patientId = patientProfile.id;

    const reviews = await getReviewsByPatientId(patientId);

    res.status(200).json({
      message: "Customer reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// validate review (chỉ đánh giá sau khi khám xong)
const addReview = async (req, res) => {
  try {
    const { patient_id, service_id, appointment_id, rating, comment } = req.body;

    if (!patient_id || !service_id || !appointment_id || !rating) {
      return res.status(400).json({
        message: "Patient, service, appointment and rating are required",
      });
    }

    const patientProfile = await findPatientByUserId(req.user.id);

    if (!patientProfile || Number(patientProfile.id) !== Number(patient_id)) {
      return res.status(403).json({
        message: "You can only review your own appointment",
      });
    }

    const normalizedRating = Number(rating);

    if (normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const hasCompletedAppointment = await checkCompletedAppointmentForReview(
      patient_id,
      service_id,
      appointment_id,
    );

    if (!hasCompletedAppointment) {
      return res.status(400).json({
        message: "Only completed appointments can be reviewed",
      });
    }

    const existingReview = await findExistingReview(patient_id, service_id);

    if (existingReview) {
      return res.status(409).json({
        message: "This service has already been reviewed by this customer",
      });
    }

    const newReview = await createReview({
      patient_id,
      service_id,
      rating: normalizedRating,
      comment,
    });

    res.status(201).json({
      message: "Review created successfully",
      data: newReview,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  listReviews,
  listMyReviews,
  addReview,
};

