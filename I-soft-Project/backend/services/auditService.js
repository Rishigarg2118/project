/**
 * Audit Log Service — logs old/new snapshots using JSONB Repository
 */
import * as repo from '../repositories/auditRepository.js';
import logger from '../config/logger.js';

export async function auditLog(client = null, tableName, actionType, recordId, oldData, newData, performedBy) {
  try {
    await repo.create(client, {
      table_name: tableName,
      action_type: actionType,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      performed_by: performedBy
    });
    logger.info(`Audit Log: ${actionType} on ${tableName}#${recordId} performed by user ID ${performedBy || 'System'}`);
  } catch (err) {
    logger.error(`Failed to write audit log: ${err.message}`);
  }
}

export async function getAuditTrail(tableName, recordId) {
  return await repo.findByRecord(tableName, recordId);
}

export async function getRecentAuditLogs(limit = 50, offset = 0) {
  return await repo.findRecent(limit, offset);
}
