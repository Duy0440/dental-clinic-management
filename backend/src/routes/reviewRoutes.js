const express = require("express");
const {
  listReviews,
  listMyReviews,
  addReview,
} = require("../controllers/reviewController");
const {
  verifyToken,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", verifyToken, authorizeRoles("admin"), listReviews);
router.get("/mine", verifyToken, authorizeRoles("customer"), listMyReviews);
router.post("/", verifyToken, authorizeRoles("customer"), addReview);

module.exports = router;
