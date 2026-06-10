import pool from '../config/db.js';
import { notifyLeaveReview } from './notificationService.js';
import { auditLog } from './auditService.js';

export const applyLeave = async (employeeId, leaveType, startDate, endDate, reason) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate duration in days
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) {
    throw new Error('End date must be on or after start date');
  }

  // Get leave balances
  const balanceRes = await pool.query(
    'SELECT * FROM leave_balances WHERE employee_id = $1',
    [employeeId]
  );

  if (balanceRes.rowCount === 0) {
    throw new Error('Leave balance records not initialized for this employee');
  }

  const balance = balanceRes.rows[0];
  const balanceColumn = `${leaveType}_leaves`; // e.g., sick_leaves, casual_leaves, earned_leaves
  const availableLeaves = balance[balanceColumn];

  if (availableLeaves === undefined) {
    throw new Error(`Invalid leave type: ${leaveType}`);
  }

  if (availableLeaves < diffDays) {
    throw new Error(`Insufficient leave balance. Requested: ${diffDays}, Available: ${availableLeaves}`);
  }

  // Insert pending leave application
  const result = await pool.query(
    `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
    [employeeId, leaveType, startDate, endDate, reason]
  );

  return result.rows[0];
};

export const reviewLeave = async (leaveId, reviewerId, status, reviewNotes) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch leave record — lock for update to prevent race conditions
    const leaveRes = await client.query('SELECT * FROM leaves WHERE id = $1 FOR UPDATE', [leaveId]);
    if (leaveRes.rowCount === 0) {
      throw new Error('Leave application not found');
    }
    const leave = leaveRes.rows[0];

    if (leave.status !== 'pending') {
      throw new Error(`Leave application has already been reviewed (Current status: ${leave.status})`);
    }

    if (status === 'approved') {
      // Calculate duration in days
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Fetch and check balance
      const balanceRes = await client.query(
        'SELECT * FROM leave_balances WHERE employee_id = $1 FOR UPDATE',
        [leave.employee_id]
      );
      if (balanceRes.rowCount === 0) {
        throw new Error('Leave balances record not found');
      }
      
      const balance = balanceRes.rows[0];
      const balanceColumn = `${leave.leave_type}_leaves`;
      const currentBalance = balance[balanceColumn];

      if (currentBalance < diffDays) {
        throw new Error(`Insufficient leave balance to approve. Required: ${diffDays}, Available: ${currentBalance}`);
      }

      // Deduct balance atomically
      await client.query(
        `UPDATE leave_balances 
         SET ${balanceColumn} = ${balanceColumn} - $1 
         WHERE employee_id = $2`,
        [diffDays, leave.employee_id]
      );
    }

    // Update leave record status
    const updatedRes = await client.query(
      `UPDATE leaves 
       SET status = $1, reviewed_by = $2, review_notes = $3 
       WHERE id = $4 RETURNING *`,
      [status, reviewerId, reviewNotes || '', leaveId]
    );

    // ✅ INSERT into audit trail (approval_history) — same transaction
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks)
       VALUES ($1, $2, $3, $4)`,
      [leaveId, reviewerId, status, reviewNotes || '']
    );

    // ✅ Insert approval_history audit entry
    await client.query(
      `INSERT INTO approval_history (leave_id, approved_by, action, remarks)
       VALUES ($1, $2, $3, $4)`,
      [leaveId, reviewerId, status, reviewNotes || '']
    );

    // ✅ Audit log — JSONB old/new snapshot
    await auditLog(client, 'leaves', 'UPDATE', parseInt(leaveId),
      { status: leave.status },
      { status, reviewed_by: reviewerId, review_notes: reviewNotes },
      reviewerId
    );

    // ✅ Notify the employee (fire-and-forget within transaction)
    const empUserRes = await client.query(
      'SELECT user_id FROM employees WHERE id = $1', [leave.employee_id]
    );
    if (empUserRes.rowCount > 0) {
      await notifyLeaveReview(client, empUserRes.rows[0].user_id, status, reviewNotes);
    }

    await client.query('COMMIT');
    return updatedRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getLeaveBalances = async (employeeId) => {
  const result = await pool.query(
    'SELECT sick_leaves, casual_leaves, earned_leaves FROM leave_balances WHERE employee_id = $1',
    [employeeId]
  );
  if (result.rowCount === 0) {
    throw new Error('Balances not initialized');
  }
  return result.rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED ANALYTICS — Teaching SQL Concepts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Department-wise Leave (GROUP BY + JOIN)
 * Concept: Aggregate by department, count total applications and approved leaves
 */
export const getDepartmentWiseLeave = async () => {
  const result = await pool.query(`
    SELECT 
      d.department_name,
      COUNT(l.id)                                               AS total_applications,
      SUM(CASE WHEN l.status = 'approved'  THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN l.status = 'rejected'  THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN l.status = 'pending'   THEN 1 ELSE 0 END) AS pending_count,
      COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END
      ), 0) AS total_approved_days
    FROM departments d
    LEFT JOIN employees e  ON e.department_id = d.id
    LEFT JOIN leaves   l  ON l.employee_id = e.id
    GROUP BY d.id, d.department_name
    ORDER BY total_applications DESC NULLS LAST
  `);
  return result.rows;
};

/**
 * 2. Monthly Leave Trend — last 6 months (DATE_TRUNC + GROUP BY)
 * Concept: Temporal aggregation using DATE_TRUNC to bucket leaves by month
 */
export const getMonthlyTrend = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
      DATE_TRUNC('month', created_at)                       AS month_start,
      COUNT(*)                                              AS applications,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
    FROM leaves
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month_start ASC
  `);
  return result.rows;
};

/**
 * 3. Most Absent Employees — top 5 (SUM + ORDER BY)
 * Concept: Find the employees who took the most approved leave days
 */
export const getMostAbsentEmployees = async () => {
  const result = await pool.query(`
    SELECT 
      u.name                                AS employee_name,
      u.email,
      e.designation,
      d.department_name,
      COUNT(l.id)                           AS total_applications,
      COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END
      ), 0)::INT                            AS total_absent_days
    FROM employees e
    JOIN users       u ON e.user_id       = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN leaves l ON l.employee_id  = e.id
    GROUP BY u.id, u.name, u.email, e.designation, d.department_name
    ORDER BY total_absent_days DESC
    LIMIT 5
  `);
  return result.rows;
};

/**
 * 4. Employee Leave RANK — WINDOW FUNCTION (RANK() OVER)
 * Concept: Rank employees by total leave days using PostgreSQL window functions
 */
export const getLeaveRankAnalytics = async () => {
  const result = await pool.query(`
    SELECT 
      u.name                                                    AS employee_name,
      e.designation,
      d.department_name,
      COUNT(l.id)                                               AS total_leaves_applied,
      SUM(CASE WHEN l.status = 'approved'  THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN l.status = 'rejected'  THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN l.status = 'pending'   THEN 1 ELSE 0 END) AS pending_count,
      COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END
      ), 0)::INT                                                AS total_leave_days,
      RANK()       OVER (ORDER BY COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END), 0) DESC)                                          AS leave_rank,
      DENSE_RANK() OVER (ORDER BY COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END), 0) DESC)                                          AS dense_rank
    FROM employees e
    JOIN users       u ON e.user_id        = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN leaves   l ON l.employee_id  = e.id
    GROUP BY u.id, u.name, e.designation, d.department_name
    ORDER BY total_leave_days DESC NULLS LAST
  `);
  return result.rows;
};

/**
 * 5. Above-Average Leave Takers — SUBQUERY
 * Concept: Use a subquery to find employees whose approved days exceed the average
 */
export const getAboveAverageLeaves = async () => {
  const result = await pool.query(`
    SELECT 
      u.name                     AS employee_name,
      e.designation,
      d.department_name,
      emp_summary.total_days     AS total_approved_days
    FROM (
      SELECT 
        l.employee_id,
        SUM(
          EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1
        )::INT AS total_days
      FROM leaves l
      WHERE l.status = 'approved'
      GROUP BY l.employee_id
    ) emp_summary
    JOIN employees   e ON e.id            = emp_summary.employee_id
    JOIN users       u ON e.user_id       = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE emp_summary.total_days > (
      SELECT AVG(sub.total_days)
      FROM (
        SELECT 
          employee_id,
          SUM(EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / 86400 + 1) AS total_days
        FROM leaves
        WHERE status = 'approved'
        GROUP BY employee_id
      ) sub
    )
    ORDER BY emp_summary.total_days DESC
  `);
  return result.rows;
};

/**
 * Get approval history for a specific leave
 */
export const getApprovalHistory = async (leaveId) => {
  const result = await pool.query(`
    SELECT 
      ah.id,
      ah.action,
      ah.remarks,
      ah.created_at,
      u.name  AS reviewer_name,
      u.email AS reviewer_email,
      u.role  AS reviewer_role
    FROM approval_history ah
    JOIN users u ON ah.approved_by = u.id
    WHERE ah.leave_id = $1
    ORDER BY ah.created_at ASC
  `, [leaveId]);
  return result.rows;
};
