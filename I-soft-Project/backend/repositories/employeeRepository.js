import pool from '../config/db.js';

export const findAll = async ({
  search = '',
  department_id,
  page = 1,
  limit = 10,
  sort_by = 'e.id',
  sort_order = 'ASC'
} = {}) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * limitNum;

  // Use the view for employee summary listing for performance optimization!
  const allowedSort = ['e.id', 'u.name', 'e.designation', 'e.salary', 'd.department_name', 'e.created_at'];
  const safeSortBy = allowedSort.includes(sort_by) ? sort_by : 'e.id';
  const safeOrder = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const conditions = [];
  const params = [];

  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR e.designation ILIKE $${params.length})`);
  }

  if (department_id) {
    params.push(parseInt(department_id));
    conditions.push(`e.department_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count matches
  const countResult = await pool.query(
    `SELECT COUNT(DISTINCT e.id)::INT AS total
     FROM employees e
     JOIN users u ON e.user_id = u.id
     LEFT JOIN departments d ON e.department_id = d.id
     ${whereClause}`,
    params
  );
  const total = countResult.rows[0].total;
  const totalPages = Math.ceil(total / limitNum);

  params.push(limitNum, offset);
  
  const query = `
    SELECT e.*, 
           u.name, 
           u.email, 
           u.role,
           d.department_name,
           COALESCE(
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', img.id, 'label', img.label, 'url', img.url)) FILTER (WHERE img.id IS NOT NULL),
             '[]'
           ) as images,
           COALESCE(
             JSON_AGG(DISTINCT es.skill_id) FILTER (WHERE es.skill_id IS NOT NULL),
             '[]'
           ) as skill_ids
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN employee_images img ON e.id = img.employee_id
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    ${whereClause}
    GROUP BY e.id, u.id, d.id
    ORDER BY ${safeSortBy} ${safeOrder}
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const result = await pool.query(query, params);
  return {
    employees: result.rows,
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

export const findById = async (id) => {
  const query = `
    SELECT e.*, 
           u.name, 
           u.email, 
           u.role,
           d.department_name,
           COALESCE(
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', img.id, 'label', img.label, 'url', img.url)) FILTER (WHERE img.id IS NOT NULL),
             '[]'
           ) as images,
           COALESCE(
             JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', s.id, 'skill_name', s.skill_name)) FILTER (WHERE s.id IS NOT NULL),
             '[]'
           ) as skills,
           COALESCE(
             JSON_AGG(DISTINCT es.skill_id) FILTER (WHERE es.skill_id IS NOT NULL),
             '[]'
           ) as skill_ids
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN employee_images img ON e.id = img.employee_id
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE e.id = $1
    GROUP BY e.id, u.id, d.id
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const findByUserId = async (userId) => {
  const query = `
    SELECT e.*, 
           u.name, 
           u.email, 
           u.role,
           d.department_name
    FROM employees e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.user_id = $1
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
};

export const findByPhone = async (phone) => {
  const result = await pool.query('SELECT * FROM employees WHERE phone = $1', [phone]);
  return result.rows[0];
};


export const create = async ({ user_id, department_id, phone, address, designation, salary }) => {
  const result = await pool.query(
    `INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
    [user_id, department_id, phone, address, designation, salary]
  );
  return result.rows[0];
};

export const update = async (id, { department_id, phone, address, designation, salary }) => {
  const result = await pool.query(
    `UPDATE employees 
     SET department_id = $1, phone = $2, address = $3, designation = $4, salary = $5
     WHERE id = $6 RETURNING *`,
    [department_id, phone, address, designation, salary, id]
  );
  return result.rows[0];
};

export const remove = async (id) => {
  const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};

export const linkSkill = async (employeeId, skillId) => {
  await pool.query(
    'INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [employeeId, skillId]
  );
};

export const unlinkSkills = async (employeeId) => {
  await pool.query('DELETE FROM employee_skills WHERE employee_id = $1', [employeeId]);
};

export const addDocument = async (employeeId, label, url) => {
  const result = await pool.query(
    'INSERT INTO employee_images (employee_id, label, url) VALUES ($1, $2, $3) RETURNING *',
    [employeeId, label, url]
  );
  return result.rows[0];
};

export const removeDocument = async (employeeId, imageId) => {
  const result = await pool.query(
    'DELETE FROM employee_images WHERE id = $1 AND employee_id = $2 RETURNING *',
    [imageId, employeeId]
  );
  return result.rows[0];
};
