import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_db';

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
