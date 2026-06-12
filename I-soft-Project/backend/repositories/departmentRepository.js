import pool from '../config/db.js';

export const findAll = async () => {
  const result = await pool.query('SELECT * FROM departments ORDER BY id ASC');
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
  return result.rows[0];
};

export const create = async (departmentName) => {
  const result = await pool.query(
    'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
    [departmentName]
  );
  return result.rows[0];
};

export const update = async (id, departmentName) => {
  const result = await pool.query(
    'UPDATE departments SET department_name = $1 WHERE id = $2 RETURNING *',
    [departmentName, id]
  );
  return result.rows[0];
};

export const remove = async (id) => {
  const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
