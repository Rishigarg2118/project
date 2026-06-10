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

export const checkIn = async (req, res) => {
  const { location, notes } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const record = await attendanceService.checkIn(employeeId, location, notes);
    res.status(201).json({ message: 'Clocked in successfully', record });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkOut = async (req, res) => {
  const { notes } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const record = await attendanceService.checkOut(employeeId, notes);
    res.json({ message: 'Clocked out successfully', record });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyTodayStatus = async (req, res) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const status = await attendanceService.getTodayStatus(employeeId);
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyLogs = async (req, res) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const logs = await attendanceService.getAttendanceLog(employeeId);
    res.json({ logs });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT att.*, u.name as employee_name, u.email as employee_email, e.designation
      FROM attendance att
      JOIN employees e ON att.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY att.check_in_time DESC
    `);
    res.json({ logs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
