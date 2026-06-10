/**
 * Winston Logger — centralised application logger
 * Levels: error > warn > info > debug
 * Outputs: console (colorized) + logs/app.log (JSON)
 */
import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, colorize, printf, json, errors } = format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    // Colorized console output
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // Persistent JSON log file — rotates at 10 MB
    new transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    // Errors-only file
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
    }),
  ],
});

export default logger;
