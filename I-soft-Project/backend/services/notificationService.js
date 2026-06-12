/**
 * Notification Service — business notification flows using Notification Repository
 */
import * as repo from '../repositories/notificationRepository.js';
import logger from '../config/logger.js';

export async function createNotification(client = null, userId, title, message, type = 'info') {
  try {
    const result = await repo.create(client, {
      user_id: userId,
      title,
      message,
      type
    });
    logger.info(`Notification created for user ${userId}: "${title}"`);
    return result;
  } catch (err) {
    logger.error(`Failed to create notification: ${err.message}`);
  }
}

export async function getNotificationsForUser(userId, limit = 20) {
  return await repo.findByUserId(userId, limit);
}

export async function getUnreadCount(userId) {
  return await repo.getUnreadCount(userId);
}

export async function markAsRead(notificationId, userId) {
  return await repo.markAsRead(notificationId, userId);
}

export async function markAllAsRead(userId) {
  await repo.markAllAsRead(userId);
}

export async function notifyLeaveReview(client, employeeUserId, status, reviewNotes) {
  const icon  = status === 'approved' ? '✅' : '❌';
  const title = `${icon} Leave Application ${status === 'approved' ? 'Approved' : 'Rejected'}`;
  const msg   = status === 'approved'
    ? `Your leave application has been approved. ${reviewNotes ? `Manager's note: "${reviewNotes}"` : ''}`
    : `Your leave application was rejected. ${reviewNotes ? `Reason: "${reviewNotes}"` : 'Contact your manager for details.'}`;
  return createNotification(client, employeeUserId, title, msg, status === 'approved' ? 'success' : 'error');
}

export async function notifyAssetAssigned(client, employeeUserId, assetName) {
  return createNotification(
    client,
    employeeUserId,
    `💻 Asset Assigned: ${assetName}`,
    `The asset "${assetName}" has been allocated to you. Please collect it from IT. Handle with care.`,
    'info'
  );
}

export async function notifyAssetReturned(employeeUserId, assetName) {
  return createNotification(
    null,
    employeeUserId,
    `🔄 Asset Returned: ${assetName}`,
    `The asset "${assetName}" has been recorded as returned from your account.`,
    'warning'
  );
}

export async function purgeOldNotifications(days = 30) {
  try {
    const count = await repo.purgeOldNotifications(days);
    logger.info(`Purged ${count} old notifications older than ${days} days.`);
    return count;
  } catch (err) {
    logger.error(`Failed to purge old notifications: ${err.message}`);
  }
}
