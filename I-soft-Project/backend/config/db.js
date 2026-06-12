import pg from 'pg';
import { DATABASE_URL } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.on('connect', () => {
  console.log('PostgreSQL database connected successfully.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

export default pool;
export { DATABASE_URL };
