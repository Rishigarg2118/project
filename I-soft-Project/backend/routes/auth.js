import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { verifyToken, JWT_SECRET } from '../middleware/authMiddleware.js';
import { validateBody, userSignupSchema, userLoginSchema } from '../utils/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed or email already registered
 */
router.post('/register', validateBody(userSignupSchema), async (req, res) => {
  const { name, email, password } = req.body;
  const role = 'user'; // Always register as standard 'user'. Only administrators can escalate roles later.
  try {
    const checkEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkEmail.rowCount > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', validateBody(userLoginSchema), async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Try to find if employee profile exists
    const empRes = await pool.query('SELECT id FROM employees WHERE user_id = $1', [user.id]);
    const employee_id = empRes.rowCount > 0 ? empRes.rows[0].id : null;

    res.json({
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee_id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get profile of currently logged-in user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 *       401:
 *         description: Access token required
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.created_at, e.id as employee_id, e.phone, e.address, e.designation, e.salary, d.department_name
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code generated successfully
 *       400:
 *         description: Email not found or invalid
 */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: 'Email not registered' });
    }

    // Generate random 6-digit OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await pool.query(
      'UPDATE users SET reset_code = $1, reset_expires = $2 WHERE email = $3',
      [resetCode, expires, email]
    );

    console.log(`[PASSWORD RESET] Code for ${email} is ${resetCode}`);
    
    res.json({
      message: 'Password reset verification code generated',
      resetCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with verification code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid/expired code or user not found
 */
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const userRes = await pool.query(
      'SELECT id, reset_code, reset_expires FROM users WHERE email = $1',
      [email]
    );
    if (userRes.rowCount === 0) {
      return res.status(400).json({ error: 'Email not registered' });
    }

    const user = userRes.rows[0];
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const now = new Date();
    if (new Date(user.reset_expires) < now) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password = $1, reset_code = NULL, reset_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
