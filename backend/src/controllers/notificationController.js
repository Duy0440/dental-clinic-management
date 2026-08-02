// xu ly thong bao trong he thong
const {
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../models/notificationModel");
const {
  refreshNotificationsForUser,
} = require("../services/notificationReminderService");

const refreshRemindersSafely = async (user) => {
  try {
    await refreshNotificationsForUser(user);
  } catch (error) {
    console.error("[notification-reminder] refresh failed", {
      message: error.message,
      userId: user?.id,
      role: user?.role,
    });
  }
};

// lay danh sach thong bao cua user
const getNotifications = async (req, res) => {
  try {
    await refreshRemindersSafely(req.user);

    const requestedLimit = Number(req.query.limit || 6);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 50)
      : 6;
    const notifications = await getNotificationsByUserId(req.user.id, limit);

    return res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch notifications",
    });
  }
};

// dem thong bao chua doc
const getUnreadCount = async (req, res) => {
  try {
    await refreshRemindersSafely(req.user);

    const unreadCount = await getUnreadNotificationCount(req.user.id);

    return res.status(200).json({
      message: "Unread notification count fetched successfully",
      data: {
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to fetch unread notification count",
    });
  }
};

// danh dau mot thong bao da doc
const readNotification = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({
        message: "Invalid notification id",
      });
    }

    const notification = await markNotificationRead(
      notificationId,
      req.user.id,
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update notification",
    });
  }
};

// danh dau tat ca da doc
const readAllNotifications = async (req, res) => {
  try {
    const updatedCount = await markAllNotificationsRead(req.user.id);

    return res.status(200).json({
      message: "All notifications marked as read",
      data: {
        updated_count: updatedCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to update notifications",
    });
  }
};

// refresh thong bao nhac lich
const refreshNotifications = async (req, res) => {
  try {
    await refreshRemindersSafely(req.user);

    const unreadCount = await getUnreadNotificationCount(req.user.id);

    return res.status(200).json({
      message: "Notifications refreshed successfully",
      data: {
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to refresh notifications",
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  readNotification,
  readAllNotifications,
  refreshNotifications,
};
