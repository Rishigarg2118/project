/**
 * Environment Configuration Loader
 * Dynamically loads the corresponding .env.{environment} file.
 */
import dotenv from 'dotenv';
import path from 'path';

// Preserve platform-provided environment variables (e.g. Render, Railway, Docker)
const platformDatabaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL;
const platformPort = process.env.PORT;
const platformFrontendUrl = process.env.FRONTEND_URL;

// Load base .env first (for shared API keys like OPENROUTER_API_KEY)
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${env}`);

// Load environment-specific overrides without clobbering system env vars
dotenv.config({ path: envPath, override: false });

// Restore platform env vars if present
if (platformDatabaseUrl) process.env.DATABASE_URL = platformDatabaseUrl;
if (platformPort) process.env.PORT = platformPort;
if (platformFrontendUrl) process.env.FRONTEND_URL = platformFrontendUrl;

console.log(`[Config] Loaded environment: ${env.toUpperCase()}`);

export const PORT = process.env.PORT || 4000;
export const DATABASE_URL = process.env.DATABASE_URL || 
                            process.env.DATABASE_PRIVATE_URL || 
                            process.env.DATABASE_PUBLIC_URL || 
                            process.env.POSTGRES_URL || 
                            process.env.DB_URL || 
                            'postgresql://postgres:postgres@localhost:5432/employee_db';
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey12345';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4566';
export const NODE_ENV = env;
export default { PORT, DATABASE_URL, JWT_SECRET, LOG_LEVEL, OPENROUTER_API_KEY, FRONTEND_URL, NODE_ENV };
