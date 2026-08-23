/**
 * Backend Entry Point
 * Runs the Express server, initializes background cron jobs.
 */
import app from './app.js';
import { PORT, NODE_ENV } from './config/env.js';
import { initCronJobs } from './jobs/cronJobs.js';
import logger from './config/logger.js';

// Start Background Cron Jobs
initCronJobs();

// Start Express Listener
app.listen(PORT, () => {
  logger.info(`===================================================`);
  logger.info(` Rishi's Emp system Backend running on port ${PORT}`);
  logger.info(` Environment             : ${NODE_ENV.toUpperCase()}`);
  logger.info(` 🔒 Helmet + Rate Limiting: ACTIVE`);
  logger.info(` 📢 Notifications Engine  : ACTIVE`);
  logger.info(` 🗂️  Audit Trail (JSONB)   : ACTIVE`);
  logger.info(` ⏰ Cron Scheduler        : ACTIVE`);
  logger.info(` 📖 Swagger Docs          : http://localhost:${PORT}/api-docs`);
  logger.info(`===================================================`);
});
