import pool from '../config/db.js';

export const findByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const findByIdentifier = async (identifier) => {
  const result = await pool.query(
    `SELECT u.* 
     FROM users u
     LEFT JOIN employees e ON u.id = e.user_id
     WHERE u.email = $1 OR e.phone = $1
     LIMIT 1`,
    [identifier]
  );
  return result.rows[0];
};


export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const create = async ({ name, email, password, role = 'user', requiresPasswordReset = false }) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, requires_password_reset, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
    [name, email, password, role, requiresPasswordReset]
  );
  return result.rows[0];
};

export const update = async (id, { name, email, role }) => {
  const result = await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role)
     WHERE id = $4 RETURNING *`,
    [name, email, role, id]
  );
  return result.rows[0];
};

export const updateResetCode = async (email, resetCode, resetExpires) => {
  const result = await pool.query(
    `UPDATE users 
     SET reset_code = $1, reset_expires = $2
     WHERE email = $3 RETURNING *`,
    [resetCode, resetExpires, email]
  );
  return result.rows[0];
};

export const findByResetCode = async (resetCode) => {
  const result = await pool.query(
    `SELECT * FROM users 
     WHERE reset_code = $1 AND reset_expires > NOW()`,
    [resetCode]
  );
  return result.rows[0];
};

export const updatePassword = async (id, hashedPassword) => {
  const result = await pool.query(
    `UPDATE users 
     SET password = $1, reset_code = NULL, reset_expires = NULL, requires_password_reset = FALSE 
     WHERE id = $2 RETURNING *`,
    [hashedPassword, id]
  );
  return result.rows[0];
};

export const findAll = async ({ limit = 100, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT id, name, email, role, created_at FROM users 
     ORDER BY id ASC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

export const count = async () => {
  const result = await pool.query('SELECT COUNT(*)::INT AS count FROM users');
  return result.rows[0].count;
};
