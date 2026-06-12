/**
 * Environment Configuration Loader
 * Dynamically loads the corresponding .env.{environment} file.
 */
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

dotenv.config({ path: envPath });

console.log(`[Config] Loaded environment: ${env.toUpperCase()} from ${envPath}`);

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_db';
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const NODE_ENV = env;
export default { PORT, DATABASE_URL, JWT_SECRET, LOG_LEVEL, NODE_ENV };
