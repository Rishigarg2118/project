/**
 * Notification Service — Event-Driven Architecture
 * Every important event (leave approved, asset assigned) creates a notification.
 * Students learn: Event-driven patterns used in SAP, Oracle HRMS, Zoho People.
 */
import pool from '../config/db.js';
import logger from '../config/logger.js';

/**
 * Create a notification for a specific user
 */
export async function createNotification(client = null, userId, title, message, type = 'info') {
  try {
    const db = client || pool;
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, message, type]
    );
    logger.info(`Notification created for user ${userId}: "${title}"`);
    return result.rows[0];
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
}

/**
 * Get all notifications for a user — ordered by newest first
 */
export async function getNotificationsForUser(userId, limit = 20) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

/**
 * Count unread notifications for a user
 */
export async function getUnreadCount(userId) {
  const result = await pool.query(
    `SELECT COUNT(*)::INT AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return result.rows[0].count;
}

/**
 * Mark one notification as read
 */
export async function markAsRead(notificationId, userId) {
  const result = await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllAsRead(userId) {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
}

/**
 * Notify a user when their leave is reviewed
 */
export async function notifyLeaveReview(client, employeeUserId, status, reviewNotes) {
  const icon  = status === 'approved' ? '✅' : '❌';
  const title = `${icon} Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const msg   = status === 'approved'
    ? `Your leave application has been approved. ${reviewNotes ? `Manager's note: "${reviewNotes}"` : ''}`
    : `Your leave application was rejected. ${reviewNotes ? `Reason: "${reviewNotes}"` : 'Contact your manager for details.'}`;
  return createNotification(client, employeeUserId, title, msg, status === 'approved' ? 'success' : 'error');
}

/**
 * Notify an employee when an asset is assigned to them
 */
export async function notifyAssetAssigned(client, employeeUserId, assetName) {
  return createNotification(
    client,
    employeeUserId,
    `💻 Asset Assigned: ${assetName}`,
    `The asset "${assetName}" has been allocated to you. Please collect it from IT. Handle with care.`,
    'info'
  );
}

/**
 * Notify an employee when an asset is returned/unallocated
 */
export async function notifyAssetReturned(employeeUserId, assetName) {
  return createNotification(
    null,
    employeeUserId,
    `🔄 Asset Returned: ${assetName}`,
    `The asset "${assetName}" has been recorded as returned from your account.`,
    'warning'
  );
}
