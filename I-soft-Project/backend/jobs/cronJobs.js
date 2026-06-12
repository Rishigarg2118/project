/**
 * Background Jobs Engine (Cron Scheduler)
 * Module 11 — Daily Backup, Notification Cleanup, Daily Leave Summary.
 */
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';
import { purgeOldNotifications } from '../services/notificationService.js';
import logger from '../config/logger.js';

// Setup backups folder
const backupDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

/**
 * Initialize all cron jobs
 */
export const initCronJobs = () => {
  logger.info('⏰ Background Jobs Engine initialized successfully.');

  // Job 1: Daily Database Backup (runs every day at midnight: '0 0 * * *')
  // For demonstration/verification, we can also support running a test trigger or log it
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Starting Daily Database Backup...');
    try {
      const tables = ['users', 'employees', 'departments', 'skills', 'leaves', 'assets', 'asset_allocations', 'attendance'];
      const backupData = {};

      for (const table of tables) {
        const res = await pool.query(`SELECT * FROM ${table}`);
        backupData[table] = res.rows;
      }

      const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      const backupPath = path.join(backupDir, filename);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      logger.info(`[CRON] Database backup saved successfully to ${backupPath}`);
    } catch (err) {
      logger.error(`[CRON] Database backup failed: ${err.message}`);
    }
  });

  // Job 2: Old Notifications Purge (runs every day at midnight: '0 0 * * *')
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Starting notifications cleanup job...');
    await purgeOldNotifications(30);
  });

  // Job 3: Daily Leaves Summary Report (runs every day at midnight: '0 0 * * *')
  cron.schedule('0 0 * * *', async () => {
    logger.info('[CRON] Compiling daily leave applications report...');
    try {
      const res = await pool.query(
        "SELECT COUNT(*)::INT as count FROM leaves WHERE status = 'pending'"
      );
      const pendingCount = res.rows[0].count;
      logger.info(`[CRON REPORT] Pending leave applications queue: ${pendingCount} applications currently awaiting manager review.`);
    } catch (err) {
      logger.error(`[CRON] Leaves report compilation failed: ${err.message}`);
    }
  });
};

/**
 * Manual trigger for database backup (useful for testing & admin portal commands)
 */
export const triggerBackupManual = async () => {
  logger.info('[Manual Backup] Triggered backup task...');
  const tables = ['users', 'employees', 'departments', 'skills', 'leaves', 'assets', 'asset_allocations', 'attendance'];
  const backupData = {};

  for (const table of tables) {
    const res = await pool.query(`SELECT * FROM ${table}`);
    backupData[table] = res.rows;
  }

  const filename = `manual-backup-${Date.now()}.json`;
  const backupPath = path.join(backupDir, filename);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

  logger.info(`[Manual Backup] Saved successfully to ${backupPath}`);
  return filename;
};
export default { initCronJobs, triggerBackupManual };
