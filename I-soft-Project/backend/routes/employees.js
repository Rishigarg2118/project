import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, employeeSchema } from '../utils/validation.js';

const router = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) and PDFs are allowed!'));
  },
});

/**
 * @swagger
 * /api/employees/upload:
 *   post:
 *     summary: Upload a document/photo
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

// GET all employees — with pagination, search, filtering, and sorting
router.get('/', verifyToken, async (req, res) => {
  try {
    const {
      search      = '',
      department_id,
      page        = 1,
      limit       = 10,
      sort_by     = 'e.id',
      sort_order  = 'ASC',
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;

    // Whitelist sortable columns to prevent SQL injection
    const allowedSort = ['e.id', 'u.name', 'e.designation', 'e.salary', 'd.department_name', 'e.created_at'];
    const safeSortBy  = allowedSort.includes(sort_by) ? sort_by : 'e.id';
    const safeOrder   = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const conditions = [];
    const params     = [];

    // Global search — employee name, email, designation
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR e.designation ILIKE $${params.length})`);
    }

    // Filter by department
    if (department_id) {
      params.push(parseInt(department_id));
      conditions.push(`e.department_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching rows (for pagination metadata)
    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT e.id)::INT AS total
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${whereClause}`,
      params
    );
    const total      = countResult.rows[0].total;
    const totalPages = Math.ceil(total / limitNum);

    // Main query with LIMIT / OFFSET
    params.push(limitNum);
    params.push(offset);

    const result = await pool.query(
      `SELECT e.*,
              u.name,
              u.email,
              u.role,
              d.department_name,
              COALESCE(
                JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', img.id, 'label', img.label, 'url', img.url))
                FILTER (WHERE img.id IS NOT NULL), '[]'
              ) AS images,
              COALESCE(
                JSON_AGG(DISTINCT es.skill_id) FILTER (WHERE es.skill_id IS NOT NULL), '[]'
              ) AS skill_ids
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employee_images img ON e.id = img.employee_id
       LEFT JOIN employee_skills es  ON e.id = es.employee_id
       ${whereClause}
       GROUP BY e.id, u.id, d.id
       ORDER BY ${safeSortBy} ${safeOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      employees: result.rows,
      pagination: {
        total,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single employee profile
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
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
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Create Employee Profile (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(employeeSchema), async (req, res) => {
  const { user_id, department_id, phone, address, designation, salary, skill_ids, images, role } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // If role is passed and request is by an admin, update the user account's system role
    if (role && req.user.role === 'admin') {
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, user_id]);
    }

    // Check if profile already exists for this user_id
    const checkProfile = await client.query('SELECT id FROM employees WHERE user_id = $1', [user_id]);
    if (checkProfile.rowCount > 0) {
      return res.status(400).json({ error: 'Employee profile already exists for this user' });
    }

    // Insert employee
    const empInsert = await client.query(
      `INSERT INTO employees (user_id, department_id, phone, address, designation, salary)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user_id, department_id, phone, address, designation, salary]
    );
    const employeeId = empInsert.rows[0].id;

    // Initialize leave balances
    await client.query(
      `INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
       VALUES ($1, 12, 12, 15)`,
      [employeeId]
    );

    // Insert skills
    if (skill_ids && skill_ids.length > 0) {
      for (const skillId of skill_ids) {
        await client.query(
          `INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)`,
          [employeeId, skillId]
        );
      }
    }

    // Insert document images
    if (images && images.length > 0) {
      for (const img of images) {
        await client.query(
          `INSERT INTO employee_images (employee_id, label, url) VALUES ($1, $2, $3)`,
          [employeeId, img.label, img.url]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Employee profile created successfully', employeeId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// PUT Update Employee Profile
router.put('/:id', verifyToken, validateBody(employeeSchema), async (req, res) => {
  const { id } = req.params;
  const { department_id, phone, address, designation, salary, skill_ids, images, role } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Confirm employee exists
    const checkEmp = await client.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (checkEmp.rowCount === 0) {
      return res.status(404).json({ error: 'Employee profile not found' });
    }
    const currentEmp = checkEmp.rows[0];

    // Restrict updates: non-admin/hr can only edit their own profile
    if (req.user.role !== 'admin' && req.user.role !== 'hr' && req.user.id !== currentEmp.user_id) {
      return res.status(403).json({ error: 'Access denied: cannot modify other employees profile' });
    }

    // If role is passed and request is by an admin, update the user account's system role
    if (role && req.user.role === 'admin') {
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, currentEmp.user_id]);
    }

    // Update main employee details
    // Note: Non-admin/hr cannot change their own salary, department, or designation
    const isHrOrAdmin = req.user.role === 'admin' || req.user.role === 'hr';
    const finalDeptId = isHrOrAdmin ? department_id : currentEmp.department_id;
    const finalDesignation = isHrOrAdmin ? designation : currentEmp.designation;
    const finalSalary = isHrOrAdmin ? salary : currentEmp.salary;

    await client.query(
      `UPDATE employees 
       SET department_id = $1, phone = $2, address = $3, designation = $4, salary = $5 
       WHERE id = $6`,
      [finalDeptId, phone, address, finalDesignation, finalSalary, id]
    );

    // Sync skills
    await client.query('DELETE FROM employee_skills WHERE employee_id = $1', [id]);
    if (skill_ids && skill_ids.length > 0) {
      for (const skillId of skill_ids) {
        await client.query(
          `INSERT INTO employee_skills (employee_id, skill_id) VALUES ($1, $2)`,
          [id, skillId]
        );
      }
    }

    // Sync images
    await client.query('DELETE FROM employee_images WHERE employee_id = $1', [id]);
    if (images && images.length > 0) {
      for (const img of images) {
        await client.query(
          `INSERT INTO employee_images (employee_id, label, url) VALUES ($1, $2, $3)`,
          [id, img.label, img.url]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Employee profile updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// DELETE Employee Profile (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
