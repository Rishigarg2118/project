import pool from '../config/db.js';

export const create = async ({ employee_id, leave_type, start_date, end_date, reason }) => {
  const result = await pool.query(
    `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status, created_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) RETURNING *`,
    [employee_id, leave_type, start_date, end_date, reason]
  );
  return result.rows[0];
};

export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM leaves WHERE id = $1', [id]);
  return result.rows[0];
};

export const findActiveBalances = async (employeeId) => {
  const result = await pool.query(
    'SELECT * FROM leave_balances WHERE employee_id = $1',
    [employeeId]
  );
  return result.rows[0];
};

export const updateBalances = async (client, employeeId, { casual_leaves, sick_leaves, earned_leaves }) => {
  const db = client || pool;
  const result = await db.query(
    `UPDATE leave_balances 
     SET casual_leaves = $1, sick_leaves = $2, earned_leaves = $3
     WHERE employee_id = $4 RETURNING *`,
    [casual_leaves, sick_leaves, earned_leaves, employeeId]
  );
  return result.rows[0];
};

export const updateStatus = async (client, id, { status, reviewed_by, review_notes }) => {
  const db = client || pool;
  const result = await db.query(
    `UPDATE leaves 
     SET status = $1, reviewed_by = $2, review_notes = $3 
     WHERE id = $4 RETURNING *`,
    [status, reviewed_by, review_notes || '', id]
  );
  return result.rows[0];
};

export const createApprovalHistory = async (client, { leave_id, approved_by, action, remarks }) => {
  const db = client || pool;
  const result = await db.query(
    `INSERT INTO approval_history (leave_id, approved_by, action, remarks, created_at)
     VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
    [leave_id, approved_by, action, remarks || '']
  );
  return result.rows[0];
};

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

// Paginated leaves list with search, status filtering, and sorting
export const findQueue = async ({
  employee_id,
  status = '',
  search = '',
  page = 1,
  limit = 10
} = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (employee_id) {
    params.push(parseInt(employee_id));
    conditions.push(`l.employee_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  }

  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(l.reason ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT l.id)::INT AS total 
     FROM leaves l
     JOIN employees e ON l.employee_id = e.id
     JOIN users u ON e.user_id = u.id
     ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limitNum);

  params.push(limitNum, offset);
  const query = `
    SELECT l.*,
           u.name AS employee_name,
           u.email AS employee_email,
           d.department_name,
           e.designation,
           COALESCE(
             (
               SELECT JSON_AGG(JSON_BUILD_OBJECT(
                 'id', ah.id,
                 'action', ah.action,
                 'remarks', ah.remarks,
                 'created_at', ah.created_at,
                 'reviewer_name', ru.name
               ) ORDER BY ah.created_at ASC)
               FROM approval_history ah
               JOIN users ru ON ah.approved_by = ru.id
               WHERE ah.leave_id = l.id
             ), '[]'
           ) AS approval_trail
    FROM leaves l
    JOIN employees e ON l.employee_id = e.id
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    ${whereClause}
    ORDER BY l.id DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(query, params);
  return {
    leaves: result.rows,
    pagination: {
      total,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  };
};

export const findAnalyticsOverall = async () => {
  const result = await pool.query(
    `SELECT status, COUNT(*)::INT AS count 
     FROM leaves 
     GROUP BY status`
  );
  return result.rows;
};

export const findAnalyticsDepartmentWise = async () => {
  const result = await pool.query(`
    SELECT 
      d.department_name,
      COUNT(l.id)::INT                                          AS total_applications,
      SUM(CASE WHEN l.status = 'approved'  THEN 1 ELSE 0 END)::INT AS approved_count,
      SUM(CASE WHEN l.status = 'rejected'  THEN 1 ELSE 0 END)::INT AS rejected_count,
      SUM(CASE WHEN l.status = 'pending'   THEN 1 ELSE 0 END)::INT AS pending_count,
      COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END
      ), 0)::INT AS total_approved_days
    FROM departments d
    LEFT JOIN employees e  ON e.department_id = d.id
    LEFT JOIN leaves   l  ON l.employee_id = e.id
    GROUP BY d.id, d.department_name
    ORDER BY total_applications DESC NULLS LAST
  `);
  return result.rows;
};

export const findAnalyticsMonthlyTrend = async () => {
  const result = await pool.query(`
    SELECT 
      TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month_label,
      DATE_TRUNC('month', created_at)                       AS month_start,
      COUNT(*)::INT                                         AS applications,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)::INT AS approved_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::INT AS rejected_count
    FROM leaves
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month_start ASC
  `);
  return result.rows;
};

export const findAnalyticsMostAbsent = async () => {
  const result = await pool.query(`
    SELECT 
      u.name                                AS employee_name,
      u.email,
      e.designation,
      d.department_name,
      COUNT(l.id)::INT                      AS total_applications,
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

export const findAnalyticsRank = async () => {
  const result = await pool.query(`
    SELECT 
      u.name                                                    AS employee_name,
      e.designation,
      d.department_name,
      COUNT(l.id)::INT                                          AS total_leaves_applied,
      SUM(CASE WHEN l.status = 'approved'  THEN 1 ELSE 0 END)::INT AS approved_count,
      SUM(CASE WHEN l.status = 'rejected'  THEN 1 ELSE 0 END)::INT AS rejected_count,
      SUM(CASE WHEN l.status = 'pending'   THEN 1 ELSE 0 END)::INT AS pending_count,
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
        END), 0) DESC)::INT                                      AS leave_rank,
      DENSE_RANK() OVER (ORDER BY COALESCE(SUM(
        CASE WHEN l.status = 'approved' 
          THEN EXTRACT(EPOCH FROM (l.end_date::timestamp - l.start_date::timestamp)) / 86400 + 1 
          ELSE 0 
        END), 0) DESC)::INT                                      AS dense_rank
    FROM employees e
    JOIN users       u ON e.user_id        = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN leaves   l ON l.employee_id  = e.id
    GROUP BY u.id, u.name, e.designation, d.department_name
    ORDER BY total_leave_days DESC NULLS LAST
  `);
  return result.rows;
};

export const findAnalyticsAboveAverage = async () => {
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
