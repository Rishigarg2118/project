import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import pool from './config/db.js';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes         from './routes/auth.js';
import employeeRoutes     from './routes/employees.js';
import departmentRoutes   from './routes/departments.js';
import skillRoutes        from './routes/skills.js';
import leaveRoutes        from './routes/leaves.js';
import assetRoutes        from './routes/assets.js';
import attendanceRoutes   from './routes/attendance.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app  = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many requests. Please try again after 15 minutes.' }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down.' }
});

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Request logger (HTTP access log via Winston)
app.use((req, res, next) => {
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/employees',     employeeRoutes);
app.use('/api/departments',   departmentRoutes);
app.use('/api/skills',        skillRoutes);
app.use('/api/leaves',        leaveRoutes);
app.use('/api/assets',        assetRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: true });
  } catch (err) {
    res.status(500).json({ status: 'error', database: false, message: err.message });
  }
});

// ─── Error Handling (must be last) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(port, () => {
  logger.info(`===================================================`);
  logger.info(` i-SOFTZONE Backend running on port ${port}`);
  logger.info(` 🔒 Helmet + Rate Limiting: ACTIVE`);
  logger.info(` 📢 Notifications Engine  : ACTIVE`);
  logger.info(` 🗂️  Audit Trail (JSONB)   : ACTIVE`);
  logger.info(` 📖 Swagger Docs: http://localhost:${port}/api-docs`);
  logger.info(`===================================================`);
});
