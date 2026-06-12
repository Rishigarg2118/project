import pool from '../config/db.js';

export const findActiveCheckIn = async (employeeId) => {
  const result = await pool.query(
    'SELECT * FROM attendance WHERE employee_id = $1 AND check_out_time IS NULL LIMIT 1',
    [employeeId]
  );
  return result.rows[0];
};

export const createCheckIn = async (employeeId, location, notes) => {
  const result = await pool.query(
    `INSERT INTO attendance (employee_id, check_in_time, location, notes)
     VALUES ($1, NOW(), $2, $3) RETURNING *`,
    [employeeId, location, notes || '']
  );
  return result.rows[0];
};

export const updateCheckOut = async (id, workedHours, notes) => {
  const result = await pool.query(
    `UPDATE attendance 
     SET check_out_time = NOW(), worked_hours = $2, notes = COALESCE($3, notes)
     WHERE id = $1 RETURNING *`,
    [id, workedHours, notes]
  );
  return result.rows[0];
};

export const getLogs = async (employeeId, { page = 1, limit = 10 } = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Count total entries
  const countRes = await pool.query(
    'SELECT COUNT(*)::INT AS total FROM attendance WHERE employee_id = $1',
    [employeeId]
  );
  const total = countRes.rows[0].total;

  const result = await pool.query(
    `SELECT * FROM attendance 
     WHERE employee_id = $1 
     ORDER BY check_in_time DESC
     LIMIT $2 OFFSET $3`,
    [employeeId, limitNum, offset]
  );

  return {
    logs: result.rows,
    pagination: {
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      limit: limitNum
    }
  };
};

export const getTodayStatus = async (employeeId) => {
  const result = await pool.query(
    `SELECT * FROM attendance 
     WHERE employee_id = $1 AND check_in_time::date = CURRENT_DATE
     ORDER BY check_in_time DESC LIMIT 1`,
    [employeeId]
  );
  return result.rows[0];
};
