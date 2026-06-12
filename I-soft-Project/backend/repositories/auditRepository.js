import pool from '../config/db.js';

export const create = async (client, { table_name, action_type, record_id, old_data, new_data, performed_by }) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO audit_logs (table_name, action_type, record_id, old_data, new_data, performed_by, created_at)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, NOW()) RETURNING *`,
    [
      table_name,
      action_type,
      record_id,
      old_data ? JSON.stringify(old_data) : null,
      new_data ? JSON.stringify(new_data) : null,
      performed_by || null
    ]
  );
  return result.rows[0];
};

export const findByRecord = async (tableName, recordId) => {
  const result = await pool.query(
    `SELECT al.*, u.name AS performer_name, u.role AS performer_role
     FROM audit_logs al
     LEFT JOIN users u ON al.performed_by = u.id
     WHERE al.table_name = $1 AND al.record_id = $2
     ORDER BY al.created_at DESC`,
    [tableName, recordId]
  );
  return result.rows;
};

export const findRecent = async (limit = 50, offset = 0) => {
  const result = await pool.query(
    `SELECT al.*, u.name AS performer_name
     FROM audit_logs al
     LEFT JOIN users u ON al.performed_by = u.id
     ORDER BY al.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};
