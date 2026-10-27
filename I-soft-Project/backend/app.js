import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

import pool from './config/db.js';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { FRONTEND_URL } from './config/env.js';
import { verifyToken, authorizeRoles } from './middleware/authMiddleware.js';

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
  origin: (origin, callback) => {
    // Allow non-browser requests or any vercel.app / localhost origins
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('vercel.app') ||
      origin === FRONTEND_URL ||
      (FRONTEND_URL && origin.startsWith(FRONTEND_URL.replace(/\/$/, '')))
    ) {
      return callback(null, true);
    }
    // Allow by default to prevent blocking frontend deployments
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
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

// Root Endpoint - Welcome & Redirect Helper
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>i-SOFTZONE API Server</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 520px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #ffffff; }
          p { color: #94a3b8; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
          .btn-group { display: flex; flex-direction: column; gap: 12px; }
          .btn { display: block; padding: 12px 20px; border-radius: 10px; font-weight: 600; text-decoration: none; font-size: 14px; transition: 0.2s; }
          .btn-primary { background: linear-gradient(135deg, #ea580c, #f97316); color: #fff; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); }
          .btn-secondary { background: #334155; color: #f8fafc; }
          .btn:hover { opacity: 0.92; transform: translateY(-1px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● API SERVER ONLINE (PORT 4000)</div>
          <h1>i-SOFTZONE Backend API</h1>
          <p>This is the Express REST API service. To interact with the graphical user interface, open the frontend portal below.</p>
          <div class="btn-group">
            <a href="http://localhost:4566/" class="btn btn-primary">🚀 Open Frontend Web App (Port 4566)</a>
            <a href="/api-docs" class="btn btn-secondary">📖 Browse Swagger API Documentation</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      name: 'i-SOFTZONE Backend API',
      status: 'UP',
      port: 4000,
      frontendUrl: 'http://localhost:4566/',
      documentation: 'http://localhost:4000/api-docs'
    });
  }
});

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

// Monitoring Stats API (Module 20 widgets data hook - Admin & HR only)
app.get('/api/v1/monitoring/stats', verifyToken, authorizeRoles('admin', 'hr', 'manager'), async (req, res, next) => {
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
