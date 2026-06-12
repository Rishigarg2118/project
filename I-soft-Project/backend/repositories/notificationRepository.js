import pool from '../config/db.js';

export const create = async (client, { user_id, title, message, type = 'info' }) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW()) RETURNING *`,
    [user_id, title, message, type]
  );
  return result.rows[0];
};

export const findByUserId = async (userId, limit = 20) => {
  const result = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = $1 
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

export const getUnreadCount = async (userId) => {
  const result = await pool.query(
    `SELECT COUNT(*)::INT AS count FROM notifications 
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0].count;
};

export const markAsRead = async (notificationId, userId) => {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
};

export const markAllAsRead = async (userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE 
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
};

export const purgeOldNotifications = async (days = 30) => {
  const result = await pool.query(
    `DELETE FROM notifications 
     WHERE created_at < NOW() - INTERVAL '$1 days'`,
    [days]
  );
  return result.rowCount;
};
