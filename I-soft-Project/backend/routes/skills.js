import express from 'express';
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, skillSchema } from '../utils/validation.js';

const router = express.Router();

// GET all skills
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY skill_name ASC');
    res.json({ skills: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create skill (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(skillSchema), async (req, res) => {
  const { skill_name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO skills (skill_name) VALUES ($1) RETURNING *',
      [skill_name]
    );
    res.status(201).json({ skill: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Skill name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE skill (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM skills WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
