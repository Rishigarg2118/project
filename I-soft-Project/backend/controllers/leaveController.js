import pool from '../config/db.js';
import * as leaveService from '../services/leaveService.js';

const getEmployeeId = async (userId) => {
  const result = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
  if (result.rowCount === 0) {
    throw new Error('Employee profile not found for this user.');
  }
  return result.rows[0].id;
};

export const applyLeave = async (req, res, next) => {
  const { leave_type, start_date, end_date, reason } = req.body;
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const leave = await leaveService.applyLeave(employeeId, leave_type, start_date, end_date, reason);
    res.status(201).json({ message: 'Leave applied successfully and is pending review', leave });
  } catch (error) {
    next(error);
  }
};

export const reviewLeave = async (req, res, next) => {
  const { id } = req.params;
  const { status, review_notes } = req.body;
  const reviewerId = req.user.id;
  try {
    const leave = await leaveService.reviewLeave(id, reviewerId, status, review_notes);
    res.json({ message: `Leave application has been ${status}`, leave });
  } catch (error) {
    next(error);
  }
};

export const getMyBalances = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const balances = await leaveService.getLeaveBalances(employeeId);
    res.json({ balances });
  } catch (error) {
    next(error);
  }
};

export const getMyLeaves = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const employeeId = await getEmployeeId(userId);
    const result = await leaveService.getLeaveQueue({ employee_id: employeeId, limit: 100 });
    res.json({ leaves: result.leaves });
  } catch (error) {
    next(error);
  }
};

export const getLeaveQueue = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 100 } = req.query;
    const result = await leaveService.getLeaveQueue({ search, status, page, limit });
    res.json({ leaves: result.leaves, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getLeaveHistory = async (req, res, next) => {
  const { leaveId } = req.params;
  try {
    const history = await leaveService.getApprovalHistory(leaveId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

/**
 * Comprehensive analytics — all 5 advanced SQL datasets
 */
export const getLeaveAnalytics = async (req, res, next) => {
  try {
    const [
      rankAnalytics,
      departmentWise,
      monthlyTrend,
      mostAbsent,
      aboveAverage,
      overall
    ] = await Promise.all([
      leaveService.getLeaveRankAnalytics(),
      leaveService.getDepartmentWiseLeave(),
      leaveService.getMonthlyTrend(),
      leaveService.getMostAbsentEmployees(),
      leaveService.getAboveAverageLeaves(),
      leaveService.getDepartmentWiseLeave().then(() => leaveService.findAnalyticsOverall ? leaveService.findAnalyticsOverall() : pool.query(`SELECT status, COUNT(*)::INT as count FROM leaves GROUP BY status`).then(r => r.rows))
    ]);

    res.json({
      rankAnalytics,
      departmentWise,
      monthlyTrend,
      mostAbsent,
      aboveAverage,
      overall
    });
  } catch (error) {
    next(error);
  }
};
