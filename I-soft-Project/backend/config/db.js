import pg from 'pg';
import { DATABASE_URL } from './env.js';

const { Pool } = pg;

const isLocal = !DATABASE_URL ||
  DATABASE_URL.includes('localhost') ||
  DATABASE_URL.includes('127.0.0.1') ||
  DATABASE_URL.includes('postgres-db');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('PostgreSQL database connected successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
export { DATABASE_URL };
