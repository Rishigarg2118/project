import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_db';
const isLocal = !databaseUrl || databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function main() {
  const email = 'rishigarg@demo.com';
  const plainPass = 'admin123456';
  const name = 'Rishi Garg';

  try {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plainPass, salt);

    // Upsert into users
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await pool.query(
        'UPDATE users SET password = $1, role = $2, requires_password_reset = false WHERE id = $3',
        [hashedPassword, 'admin', userId]
      );
      console.log(`Updated user ${email} with password.`);
    } else {
      const res = await pool.query(
        'INSERT INTO users (name, email, password, role, requires_password_reset) VALUES ($1, $2, $3, $4, false) RETURNING id',
        [name, email, hashedPassword, 'admin']
      );
      userId = res.rows[0].id;
      console.log(`Created user ${email}.`);
    }

    // Check employee profile
    const empCheck = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
    if (empCheck.rows.length === 0) {
      const deptRes = await pool.query('SELECT id FROM departments LIMIT 1');
      const deptId = deptRes.rows[0]?.id || null;

      const empRes = await pool.query(`
        INSERT INTO employees (user_id, department_id, phone, address, designation, salary)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, deptId, '+91 9876543210', 'Headquarters', 'System Administrator', 120000]);

      const empId = empRes.rows[0].id;
      await pool.query(`
        INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
        VALUES ($1, 15, 15, 20)
        ON CONFLICT DO NOTHING
      `, [empId]);
      console.log(`Created employee profile for ${name}`);
    }

    console.log('User setup complete!');
  } catch (err) {
    console.error('Error seeding user:', err.message);
  } finally {
    await pool.end();
  }
}

main();
