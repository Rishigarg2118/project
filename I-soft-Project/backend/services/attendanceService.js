import pool from '../config/db.js';

export const checkIn = async (employeeId, location, notes) => {
  // Check if already checked in
  const activeRes = await pool.query(
    'SELECT * FROM attendance WHERE employee_id = $1 AND check_out_time IS NULL LIMIT 1',
    [employeeId]
  );
  if (activeRes.rowCount > 0) {
    throw new Error('Employee is already checked in.');
  }

  const result = await pool.query(
    `INSERT INTO attendance (employee_id, check_in_time, location, notes)
     VALUES ($1, NOW(), $2, $3) RETURNING *`,
    [employeeId, location, notes || '']
  );
  return result.rows[0];
};

export const checkOut = async (employeeId, notes) => {
  // Find active check-in
  const activeRes = await pool.query(
    'SELECT * FROM attendance WHERE employee_id = $1 AND check_out_time IS NULL LIMIT 1',
    [employeeId]
  );
  if (activeRes.rowCount === 0) {
    throw new Error('No active check-in found for this employee.');
  }

  const activeRecord = activeRes.rows[0];
  const checkInTime = new Date(activeRecord.check_in_time);
  const checkOutTime = new Date();
  
  // Calculate worked hours (rounded to 2 decimal places)
  const diffMs = checkOutTime - checkInTime;
  const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

  const result = await pool.query(
    `UPDATE attendance 
     SET check_out_time = NOW(), worked_hours = $2, notes = COALESCE($3, notes)
     WHERE id = $1 RETURNING *`,
    [activeRecord.id, hours, notes]
  );
  return result.rows[0];
};

export const getAttendanceLog = async (employeeId) => {
  const result = await pool.query(
    `SELECT * FROM attendance 
     WHERE employee_id = $1 
     ORDER BY check_in_time DESC`,
    [employeeId]
  );
  return result.rows;
};

export const getTodayStatus = async (employeeId) => {
  const result = await pool.query(
    `SELECT * FROM attendance 
     WHERE employee_id = $1 AND check_in_time::date = CURRENT_DATE
     ORDER BY check_in_time DESC LIMIT 1`,
    [employeeId]
  );
  if (result.rowCount === 0) {
    return { checkedIn: false, record: null };
  }
  const record = result.rows[0];
  return {
    checkedIn: record.check_out_time === null,
    record,
  };
};
