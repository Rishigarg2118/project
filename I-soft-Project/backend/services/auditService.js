/**
 * Audit Log Service — records every important data change
 * Concept: JSONB columns to store old_data + new_data snapshots
 * Usage: await auditLog(pool, 'employees', 'UPDATE', id, oldRow, newRow, userId);
 */
import pool from '../config/db.js';
import logger from '../config/logger.js';

/**
 * @param {object} client - Optional pg client for transactions, falls back to pool
 * @param {string} tableName - Name of the affected table
 * @param {string} actionType - 'INSERT' | 'UPDATE' | 'DELETE'
 * @param {number} recordId - Primary key of the affected record
 * @param {object|null} oldData - Row before change (null for INSERT)
 * @param {object|null} newData - Row after change (null for DELETE)
 * @param {number|null} performedBy - User ID who made the change
 */
export async function auditLog(client = null, tableName, actionType, recordId, oldData, newData, performedBy) {
  try {
    const db = client || pool;
    await db.query(
      `INSERT INTO audit_logs (table_name, action_type, record_id, old_data, new_data, performed_by)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
      [
        tableName,
        actionType,
        recordId,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        performedBy || null
      ]
    );
    logger.info(`Audit: ${actionType} on ${tableName}#${recordId} by user ${performedBy}`);
  } catch (err) {
    // Audit log failure must NOT crash the main operation — log and continue
    logger.error(`Failed to write audit log: ${err.message}`);
  }
}

/**
 * Get audit trail for a specific record
 */
export async function getAuditTrail(tableName, recordId) {
  const result = await pool.query(
    `SELECT al.*, u.name AS performer_name, u.role AS performer_role
     FROM audit_logs al
     LEFT JOIN users u ON al.performed_by = u.id
     WHERE al.table_name = $1 AND al.record_id = $2
     ORDER BY al.created_at DESC`,
    [tableName, recordId]
  );
  return result.rows;
}

/**
 * Get recent audit logs (for admin panel)
 */
export async function getRecentAuditLogs(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT al.*, u.name AS performer_name
     FROM audit_logs al
     LEFT JOIN users u ON al.performed_by = u.id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}
