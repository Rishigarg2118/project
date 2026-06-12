/**
 * Leave Service Layer — manages leave application workflows and ACID transactions
 * Utilizes leaveRepository for query separation.
 */
import pool from '../config/db.js';
import * as repo from '../repositories/leaveRepository.js';
import { notifyLeaveReview } from './notificationService.js';
import { auditLog } from './auditService.js';

export const applyLeave = async (employeeId, leaveType, startDate, endDate, reason) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate duration in days
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) {
    const error = new Error('End date must be on or after start date');
    error.statusCode = 400;
    throw error;
  }

  // Get leave balances
  const balance = await repo.findActiveBalances(employeeId);
  if (!balance) {
    const error = new Error('Leave balance records not initialized for this employee');
    error.statusCode = 400;
    throw error;
  }

  const balanceColumn = `${leaveType}_leaves`; // e.g. sick_leaves, casual_leaves, earned_leaves
  const availableLeaves = balance[balanceColumn];

  if (availableLeaves === undefined) {
    const error = new Error(`Invalid leave type: ${leaveType}`);
    error.statusCode = 400;
    throw error;
  }

  if (availableLeaves < diffDays) {
    const error = new Error(`Insufficient leave balance. Requested: ${diffDays}, Available: ${availableLeaves}`);
    error.statusCode = 422;
    throw error;
  }

  // Insert pending leave application
  return await repo.create({
    employee_id: employeeId,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    reason
  });
};

export const reviewLeave = async (leaveId, reviewerId, status, reviewNotes) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock and retrieve leave record
    const leaveRes = await client.query('SELECT * FROM leaves WHERE id = $1 FOR UPDATE', [leaveId]);
    if (leaveRes.rowCount === 0) {
      const error = new Error('Leave application not found');
      error.statusCode = 404;
      throw error;
    }
    const leave = leaveRes.rows[0];

    if (leave.status !== 'pending') {
      const error = new Error('Leave application has already been processed');
      error.statusCode = 400;
      throw error;
    }

    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

    // 2. If approved, deduct available balance
    if (status === 'approved') {
      const balanceRes = await client.query(
        'SELECT * FROM leave_balances WHERE employee_id = $1 FOR UPDATE',
        [leave.employee_id]
      );
      if (balanceRes.rowCount === 0) {
        const error = new Error('Employee leave balance record not found');
        error.statusCode = 404;
        throw error;
      }

      const balance = balanceRes.rows[0];
      const balanceColumn = `${leave.leave_type}_leaves`; // casual_leaves, sick_leaves, earned_leaves
      const availableLeaves = balance[balanceColumn];

      if (availableLeaves < diffDays) {
        const error = new Error(`Insufficient leave balance to approve this request. Needed: ${diffDays}, Available: ${availableLeaves}`);
        error.statusCode = 422;
        throw error;
      }

      const updatedBalances = { ...balance };
      updatedBalances[balanceColumn] -= diffDays;

      await repo.updateBalances(client, leave.employee_id, updatedBalances);
    }

    // 3. Update leave status
    const updatedLeave = await repo.updateStatus(client, leaveId, {
      status,
      reviewed_by: reviewerId,
      review_notes: reviewNotes
    });

    // 4. Create approval history audit trace
    await repo.createApprovalHistory(client, {
      leave_id: leaveId,
      approved_by: reviewerId,
      action: status,
      remarks: reviewNotes || ''
    });

    // 5. Audit logs JSONB old/new snapshot
    await auditLog(client, 'leaves', 'UPDATE', parseInt(leaveId),
      { status: leave.status },
      { status, reviewed_by: reviewerId, review_notes: reviewNotes },
      reviewerId
    );

    // 6. Notify the employee (fire-and-forget inside transaction)
    const empUserRes = await client.query(
      'SELECT user_id FROM employees WHERE id = $1', [leave.employee_id]
    );
    if (empUserRes.rowCount > 0) {
      await notifyLeaveReview(client, empUserRes.rows[0].user_id, status, reviewNotes);
    }

    await client.query('COMMIT');
    return updatedLeave;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getLeaveBalances = async (employeeId) => {
  const balance = await repo.findActiveBalances(employeeId);
  if (!balance) {
    const error = new Error('Balances not initialized');
    error.statusCode = 404;
    throw error;
  }
  return balance;
};

export const getLeaveQueue = async (filters) => {
  return await repo.findQueue(filters);
};

export const getDepartmentWiseLeave = async () => {
  return await repo.findAnalyticsDepartmentWise();
};

export const getMonthlyTrend = async () => {
  return await repo.findAnalyticsMonthlyTrend();
};

export const getMostAbsentEmployees = async () => {
  return await repo.findAnalyticsMostAbsent();
};

export const getLeaveRankAnalytics = async () => {
  return await repo.findAnalyticsRank();
};

export const getAboveAverageLeaves = async () => {
  return await repo.findAnalyticsAboveAverage();
};

export const getApprovalHistory = async (leaveId) => {
  return await repo.getApprovalHistory(leaveId);
};
