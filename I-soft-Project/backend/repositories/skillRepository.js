import pool from '../config/db.js';

export const findAll = async () => {
  const result = await pool.query('SELECT * FROM skills ORDER BY id ASC');
  return result.rows;
};

export const findById = async (id) => {
  const result = await pool.query('SELECT * FROM skills WHERE id = $1', [id]);
  return result.rows[0];
};

export const create = async (skillName) => {
  const result = await pool.query(
    'INSERT INTO skills (skill_name) VALUES ($1) RETURNING *',
    [skillName]
  );
  return result.rows[0];
};

export const update = async (id, skillName) => {
  const result = await pool.query(
    'UPDATE skills SET skill_name = $1 WHERE id = $2 RETURNING *',
    [skillName, id]
  );
  return result.rows[0];
};

export const remove = async (id) => {
  const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
