import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, departmentSchema } from '../utils/validation.js';
import departmentService from '../services/departmentService.js';

const router = express.Router();

// GET all departments (cached)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const departments = await departmentService.getDepartments();
    res.json({ departments });
  } catch (error) {
    next(error);
  }
});

// POST Create department (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(departmentSchema), async (req, res, next) => {
  const { department_name } = req.body;
  try {
    const department = await departmentService.createDepartment(department_name);
    res.status(201).json({ department });
  } catch (error) {
    next(error);
  }
});

// DELETE department (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res, next) => {
  const { id } = req.params;
  try {
    const department = await departmentService.deleteDepartment(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
