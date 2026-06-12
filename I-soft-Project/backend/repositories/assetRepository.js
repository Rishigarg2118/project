/**
 * Asset Repository — Data Access Layer (DAL) for assets, allocations and history
 * Separates SQL queries from service/business logic.
 */
import pool from '../config/db.js';

export const findAll = async ({ search = '', status = '', page = 1, limit = 10 } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(a.name ILIKE $${params.length} OR a.serial_number ILIKE $${params.length})`);
  }

  if (status) {
    params.push(status);
    conditions.push(`a.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT a.id)::INT AS total FROM assets a ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;

  params.push(limitNum, offset);
  const query = `
    SELECT a.*, 
           aa.employee_id, 
           u.name as allocated_to,
           u.id as employee_user_id,
           aa.allocated_at
    FROM assets a
    LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.returned_at IS NULL
    LEFT JOIN employees e ON aa.employee_id = e.id
    LEFT JOIN users u ON e.user_id = u.id
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(query, params);
  return {
    assets: result.rows,
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum,
    }
  };
};

export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
  return result.rows[0];
};

export const create = async ({ name, serial_number, status, description }) => {
  const result = await pool.query(
    `INSERT INTO assets (name, serial_number, status, description)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, serial_number, status || 'available', description || '']
  );
  return result.rows[0];
};

export const update = async (id, { name, serial_number, status, description }) => {
  const result = await pool.query(
    `UPDATE assets 
     SET name = $1, serial_number = $2, status = $3, description = $4 
     WHERE id = $5 RETURNING *`,
    [name, serial_number, status, description, id]
  );
  return result.rows[0];
};

export const remove = async (id) => {
  const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

export const findActiveAllocation = async (client, assetId) => {
  const db = client || pool;
  const result = await db.query(
    `SELECT * FROM asset_allocations 
     WHERE asset_id = $1 AND returned_at IS NULL 
     ORDER BY allocated_at DESC LIMIT 1`,
    [assetId]
  );
  return result.rows[0];
};

export const createAllocation = async (client, { asset_id, employee_id, notes }) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO asset_allocations (asset_id, employee_id, notes, allocated_at)
     VALUES ($1, $2, $3, NOW()) RETURNING *`,
    [asset_id, employee_id, notes || '']
  );
  return result.rows[0];
};

export const updateAllocation = async (client, id, { returned_at, notes }) => {
  const db = client || pool;
  const result = await db.query(
    `UPDATE asset_allocations 
     SET returned_at = $1, notes = COALESCE($2, notes) 
     WHERE id = $3 RETURNING *`,
    [returned_at, notes, id]
  );
  return result.rows[0];
};

export const createHistory = async (client, { asset_id, action, remarks, created_by }) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO asset_history (asset_id, action, remarks, created_by, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [asset_id, action, remarks || '', created_by || null]
  );
  return result.rows[0];
};

export const getHistory = async (assetId) => {
  const result = await pool.query(
    `SELECT aa.*, e.phone, u.name as employee_name, u.email as employee_email
     FROM asset_allocations aa
     JOIN employees e ON aa.employee_id = e.id
     JOIN users u ON e.user_id = u.id
     WHERE aa.asset_id = $1
     ORDER BY aa.allocated_at DESC`,
    [assetId]
  );
  return result.rows;
};
