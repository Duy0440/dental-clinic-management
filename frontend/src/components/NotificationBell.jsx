// hien thi chuong thong bao
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./notificationBell.css";

const formatNotificationTime = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function NotificationBell({ tone = "light" }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("idle");

  // dem thong bao chua doc
  const fetchUnreadCount = async () => {
    try {
      const response = await axiosClient.get("/notifications/unread-count");
      setUnreadCount(Number(response.data.data?.unread_count) || 0);
    } catch {
      // The dropdown presents the actionable error state when the user opens it.
    }
  };

  // lay danh sach thong bao
  const fetchNotifications = async () => {
    setStatus("loading");

    try {
      const [listResponse, countResponse] = await Promise.all([
        axiosClient.get("/notifications?limit=6"),
        axiosClient.get("/notifications/unread-count"),
      ]);

      setNotifications(listResponse.data.data || []);
      setUnreadCount(Number(countResponse.data.data?.unread_count) || 0);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const intervalId = window.setInterval(fetchUnreadCount, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    fetchNotifications();

    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // click thong bao va dieu huong
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await axiosClient.patch(`/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true } : item,
          ),
        );
        setUnreadCount((current) => Math.max(current - 1, 0));
      } catch {
        return;
      }
    }

    setIsOpen(false);
    if (notification.action_url?.startsWith("/")) {
      navigate(notification.action_url);
    }
  };

  // danh dau tat ca da doc
  const handleReadAll = async () => {
    try {
      await axiosClient.patch("/notifications/read-all");
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
      setUnreadCount(0);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      className={`notification-bell notification-bell-${tone}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="notification-bell-trigger"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-unread-badge">
            {unreadCount >= 100 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section className="notification-dropdown" aria-label="Thông báo mới">
          <div className="notification-dropdown-header">
            <div>
              <strong>Thông báo</strong>
              <span>{unreadCount} chưa đọc</span>
            </div>
            {unreadCount > 0 && (
              <button type="button" onClick={handleReadAll}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {status === "loading" && (
              <p className="notification-dropdown-state">
                Đang tải thông báo...
              </p>
            )}

            {status === "error" && (
              <div className="notification-dropdown-state">
                <p>Không thể tải thông báo.</p>
                <button type="button" onClick={fetchNotifications}>
                  Thử lại
                </button>
              </div>
            )}

            {status === "success" && notifications.length === 0 && (
              <p className="notification-dropdown-state">
                Chưa có thông báo.
              </p>
            )}

            {status === "success" &&
              notifications.map((notification) => (
                <button
                  type="button"
                  className={`notification-item ${
                    notification.is_read ? "" : "notification-item-unread"
                  }`}
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <span className="notification-item-dot" aria-hidden="true" />
                  <span className="notification-item-content">
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <time>{formatNotificationTime(notification.created_at)}</time>
                  </span>
                </button>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
