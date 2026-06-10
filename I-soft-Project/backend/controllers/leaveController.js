import pool from '../config/db.js';
import * as leaveService from '../services/leaveService.js';

const getEmployeeId = async (userId) => {
  const result = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
  if (result.rowCount === 0) {
    throw new Error('Employee profile not found for this user.');
  }
  return result.rows[0].id;
};

export const applyLeave = async (req, res) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const leave = await leaveService.applyLeave(employeeId, leave_type, start_date, end_date, reason);
    res.status(201).json({ message: 'Leave applied successfully and is pending review', leave });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const reviewLeave = async (req, res) => {
  const { id } = req.params;
  const { status, review_notes } = req.body;
  const reviewerId = req.user.id;
  try {
    const leave = await leaveService.reviewLeave(id, reviewerId, status, review_notes);
    res.json({ message: `Leave application has been ${status}`, leave });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyBalances = async (req, res) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const balances = await leaveService.getLeaveBalances(employeeId);
    res.json({ balances });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyLeaves = async (req, res) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const result = await pool.query(
      `SELECT l.*, u.name as reviewer_name 
       FROM leaves l 
       LEFT JOIN users u ON l.reviewed_by = u.id
       WHERE l.employee_id = $1 
       ORDER BY l.created_at DESC`,
      [employeeId]
    );
    res.json({ leaves: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaveQueue = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        u.name                       AS employee_name,
        u.email                      AS employee_email,
        e.designation,
        d.department_name,
        reviewer.name                AS reviewer_name,
        COALESCE(
          JSON_AGG(
            JSONB_BUILD_OBJECT(
              'action',        ah.action,
              'remarks',       ah.remarks,
              'reviewer_name', rv.name,
              'reviewer_role', rv.role,
              'created_at',    ah.created_at
            ) ORDER BY ah.created_at
          ) FILTER (WHERE ah.id IS NOT NULL),
          '[]'
        )                            AS audit_trail
      FROM leaves l
      JOIN employees   e  ON l.employee_id  = e.id
      JOIN users       u  ON e.user_id      = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users  reviewer ON l.reviewed_by  = reviewer.id
      LEFT JOIN approval_history ah ON ah.leave_id = l.id
      LEFT JOIN users  rv  ON ah.approved_by = rv.id
      GROUP BY l.id, u.name, u.email, e.designation, d.department_name, reviewer.name
      ORDER BY CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, l.created_at DESC
    `);
    res.json({ leaves: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getLeaveHistory = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const history = await leaveService.getApprovalHistory(leaveId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Comprehensive analytics — all 5 advanced SQL datasets
 */
export const getLeaveAnalytics = async (req, res) => {
  try {
    const [
      rankAnalytics,
      departmentWise,
      monthlyTrend,
      mostAbsent,
      aboveAverage,
      overallRes
    ] = await Promise.all([
      leaveService.getLeaveRankAnalytics(),
      leaveService.getDepartmentWiseLeave(),
      leaveService.getMonthlyTrend(),
      leaveService.getMostAbsentEmployees(),
      leaveService.getAboveAverageLeaves(),
      pool.query(`SELECT status, COUNT(*) as count FROM leaves GROUP BY status`)
    ]);

    res.json({
      rankAnalytics,
      departmentWise,
      monthlyTrend,
      mostAbsent,
      aboveAverage,
      overall: overallRes.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
