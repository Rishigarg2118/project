import pool from '../config/db.js';
import * as attendanceService from '../services/attendanceService.js';

// Helper to get employee ID from user ID
const getEmployeeId = async (userId) => {
  const result = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
  if (result.rowCount === 0) {
    throw new Error('Employee profile not found for this user.');
  }
  return result.rows[0].id;
};

export const checkIn = async (req, res, next) => {
  const { location, notes } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const record = await attendanceService.checkIn(employeeId, location, notes);
    res.status(201).json({ message: 'Clocked in successfully', record });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  const { notes } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const record = await attendanceService.checkOut(employeeId, notes);
    res.json({ message: 'Clocked out successfully', record });
  } catch (error) {
    next(error);
  }
};

export const getMyTodayStatus = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const status = await attendanceService.getTodayStatus(employeeId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

export const getMyLogs = async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  try {
    const employeeId = await getEmployeeId(userId);
    const result = await attendanceService.getAttendanceLog(employeeId, { page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllLogs = async (req, res, next) => {
  const { page = 1, limit = 100 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  try {
    const countRes = await pool.query('SELECT COUNT(*)::INT AS total FROM attendance');
    const total = countRes.rows[0].total;

    const result = await pool.query(`
      SELECT att.*, u.name as employee_name, u.email as employee_email, e.designation
      FROM attendance att
      JOIN employees e ON att.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY att.check_in_time DESC
      LIMIT $1 OFFSET $2
    `, [limitNum, offset]);

    res.json({
      logs: result.rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id AS employee_id,
        u.name AS employee_name,
        AVG(EXTRACT(HOUR FROM att.check_in_time) + EXTRACT(MINUTE FROM att.check_in_time)/60.0)::NUMERIC(4,2) AS avg_check_in_hour,
        AVG(EXTRACT(HOUR FROM att.check_out_time) + EXTRACT(MINUTE FROM att.check_out_time)/60.0)::NUMERIC(4,2) AS avg_check_out_hour
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN attendance att ON e.id = att.employee_id
      GROUP BY e.id, u.name
      ORDER BY u.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
