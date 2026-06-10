import express from 'express';
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, departmentSchema } from '../utils/validation.js';

const router = express.Router();

// GET all departments
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY department_name ASC');
    res.json({ departments: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create department (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(departmentSchema), async (req, res) => {
  const { department_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO departments (department_name) VALUES ($1) RETURNING *',
      [department_name]
    );
    res.status(201).json({ department: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Department name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE department (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
