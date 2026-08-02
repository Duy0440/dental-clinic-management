const express = require("express");
const {
  getNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  refreshNotifications,
} = require("../controllers/notificationController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(verifyToken);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.post("/refresh", refreshNotifications);
router.patch("/read-all", readAllNotifications);
router.patch("/:id/read", readNotification);

module.exports = router;
