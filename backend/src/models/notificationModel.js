// truy van du lieu thong bao
const pool = require("../config/db");

const createNotification = async (notification, db = pool) => {
  const query = `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      dedupe_key
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (dedupe_key) DO NOTHING
    RETURNING
      id,
      user_id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      is_read,
      read_at,
      dedupe_key,
      created_at
  `;

  const values = [
    notification.user_id,
    notification.type,
    notification.title,
    notification.message,
    notification.related_entity_type || null,
    notification.related_entity_id || null,
    notification.action_url || null,
    notification.dedupe_key,
  ];

  const result = await db.query(query, values);
  return result.rows[0] || null;
};

const getNotificationsByUserId = async (userId, limit = 6, db = pool) => {
  const query = `
    SELECT
      id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      is_read,
      read_at,
      created_at
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC
    LIMIT $2
  `;

  const result = await db.query(query, [userId, limit]);
  return result.rows;
};

const getUnreadNotificationCount = async (userId, db = pool) => {
  const query = `
    SELECT COUNT(*)::INTEGER AS unread_count
    FROM notifications
    WHERE user_id = $1
      AND is_read = FALSE
  `;

  const result = await db.query(query, [userId]);
  return result.rows[0]?.unread_count || 0;
};

const markNotificationRead = async (notificationId, userId, db = pool) => {
  const query = `
    UPDATE notifications
    SET
      is_read = TRUE,
      read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE id = $1
      AND user_id = $2
    RETURNING
      id,
      type,
      title,
      message,
      related_entity_type,
      related_entity_id,
      action_url,
      is_read,
      read_at,
      created_at
  `;

  const result = await db.query(query, [notificationId, userId]);
  return result.rows[0] || null;
};

const markAllNotificationsRead = async (userId, db = pool) => {
  const query = `
    UPDATE notifications
    SET
      is_read = TRUE,
      read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE user_id = $1
      AND is_read = FALSE
  `;

  const result = await db.query(query, [userId]);
  return result.rowCount;
};

module.exports = {
  createNotification,
  getNotificationsByUserId,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
};
