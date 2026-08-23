import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import pool from './config/db.js';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { FRONTEND_URL } from './config/env.js';

// Route imports
import authRoutes         from './routes/auth.js';
import employeeRoutes     from './routes/employees.js';
import departmentRoutes   from './routes/departments.js';
import skillRoutes        from './routes/skills.js';
import leaveRoutes        from './routes/leaves.js';
import assetRoutes        from './routes/assets.js';
import attendanceRoutes   from './routes/attendance.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes           from './routes/ai.js';

// Import request incrementer for stats monitoring
import { incrementApiRequests } from './services/authService.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── Security Hardening ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Too many requests. Please try again after 15 minutes.' }
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: 'draft-7', legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Please slow down.' }
});

// ─── Core Middleware ─────────────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:4566', 'http://localhost:5173', 'http://localhost:5180', 'http://localhost:5182'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Central API requests request logger + counter
app.use((req, res, next) => {
  incrementApiRequests();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

// Static uploads directory serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI spec serving
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── API Versioning & Fallbacks (Module 6) ──────────────────────────────────
// Mounting both v1 endpoints and legacy endpoints for backwards compatibility
const registerRoutes = (prefix) => {
  app.use(`${prefix}/auth`,          authRoutes);
  app.use(`${prefix}/employees`,     employeeRoutes);
  app.use(`${prefix}/departments`,   departmentRoutes);
  app.use(`${prefix}/skills`,        skillRoutes);
  app.use(`${prefix}/leaves`,        leaveRoutes);
  app.use(`${prefix}/assets`,        assetRoutes);
  app.use(`${prefix}/attendance`,    attendanceRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/ai`,            aiRoutes);
};

registerRoutes('/api/v1'); // Future ready versioned APIs
registerRoutes('/api');    // Backwards compatible mapping

// Monitoring Stats API (Module 20 widgets data hook)
app.get('/api/v1/monitoring/stats', async (req, res, next) => {
  try {
    const usersCountRes = await pool.query('SELECT COUNT(*)::INT AS count FROM users');
    const dbStatus = await pool.query('SELECT 1').then(() => 'CONNECTED').catch(() => 'DISCONNECTED');
    
    // Import active log counts
    const { failedLoginsCounter, apiRequestsCounter } = await import('./services/authService.js');

    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      dbStatus,
      totalUsers: usersCountRes.rows[0].count,
      apiRequests: apiRequestsCounter,
      failedLogins: failedLoginsCounter
    });
  } catch (error) {
    next(error);
  }
});

// Health check endpoint (Module 20)
app.get('/api/v1/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } catch (err) {
    const connectionStr = pool.options?.connectionString || '';
    const redactedUrl = connectionStr.replace(/:[^@/]+@/, ':***@');
    res.status(500).json({ 
      status: 'DOWN', 
      database: 'DISCONNECTED', 
      message: err.message || err.toString() || String(err),
      url: redactedUrl,
      stack: err.stack
    });
  }
});

// Backward compatible health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: true });
  } catch (err) {
    const connectionStr = pool.options?.connectionString || '';
    const redactedUrl = connectionStr.replace(/:[^@/]+@/, ':***@');
    res.status(500).json({ 
      status: 'error', 
      database: false, 
      message: err.message || err.toString() || String(err),
      url: redactedUrl
    });
  }
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
