import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateEmployee } from '../validators/employee.validator.js';
import * as employeeController from '../controllers/employeeController.js';

const router = express.Router();

// Multer storage setup according to Module 13 File Storage Standards
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const label = req.headers['x-file-label'] || 'documents';
    let subfolder = 'documents';

    const labelLower = label.toLowerCase();
    if (labelLower.includes('photo') || labelLower.includes('avatar') || labelLower.includes('profile') || labelLower.includes('employee')) {
      subfolder = 'employees';
    } else if (labelLower.includes('cert') || labelLower.includes('resume') || labelLower.includes('experience')) {
      subfolder = 'certificates';
    } else if (labelLower.includes('asset') || labelLower.includes('device') || labelLower.includes('hardware')) {
      subfolder = 'assets';
    } else {
      // fallback based on extension
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.pdf') {
        subfolder = 'certificates';
      } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        subfolder = 'employees';
      }
    }

    const uploadPath = path.join('uploads', subfolder);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit validation
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
  // Construct dynamic path including subdirectory (e.g. /uploads/employees/...)
  const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
  const fileUrl = `${req.protocol}://${req.get('host')}/${relativePath}`;
  res.json({ url: fileUrl, filename: req.file.filename });
});

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with pagination & search
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get('/', verifyToken, employeeController.getEmployees);

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee profile details
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee details
 */
router.get('/:id', verifyToken, employeeController.getEmployeeById);

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create new employee profile (HR / Admin)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Employee profile created
 */
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateEmployee, employeeController.createEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee details (HR / Admin)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:id', verifyToken, authorizeRoles('admin', 'hr'), validateEmployee, employeeController.updateEmployee);

/**
 * @swagger
 * /api/employees/{id}:
 *   delete:
 *     summary: Delete employee profile (Admin / HR)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile deleted
 */
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), employeeController.deleteEmployee);

export default router;
