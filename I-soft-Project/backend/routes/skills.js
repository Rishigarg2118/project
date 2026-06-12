import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, skillSchema } from '../utils/validation.js';
import skillService from '../services/skillService.js';

const router = express.Router();

// GET all skills (cached)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const skills = await skillService.getSkills();
    res.json({ skills });
  } catch (error) {
    next(error);
  }
});

// POST Create skill (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(skillSchema), async (req, res, next) => {
  const { skill_name } = req.body;
  try {
    const skill = await skillService.createSkill(skill_name);
    res.status(201).json({ skill });
  } catch (error) {
    next(error);
  }
});

// DELETE skill (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const skill = await skillService.deleteSkill(id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
