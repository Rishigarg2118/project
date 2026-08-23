import pg from 'pg';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';

// Load env
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: path.resolve(process.cwd(), `.env.${env}`) });

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL || '';
const isLocal = !databaseUrl ||
  databaseUrl.includes('localhost') ||
  databaseUrl.includes('127.0.0.1') ||
  databaseUrl.includes('postgres-db');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('===================================================');
  console.log("       Rishi's Emp system Admin Account Creator CLI");
  console.log('===================================================');

  try {
    const name = (await question('Enter Admin Name: ')).trim();
    if (!name) {
      console.error('Error: Name is required.');
      process.exit(1);
    }

    const email = (await question('Enter Admin Email: ')).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('Error: A valid email address is required.');
      process.exit(1);
    }

    const password = await question('Enter Admin Password: ');
    if (!password || password.length < 6) {
      console.error('Error: Password must be at least 6 characters long.');
      process.exit(1);
    }

    // Check if user already exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      console.error(`Error: User with email "${email}" already exists.`);
      process.exit(1);
    }

    // Hash password with bcrypt cost factor 12
    console.log('\n🔒 Hashing password with bcrypt (cost factor 12)...');
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('💾 Storing administrator record in database...');
    // Begin transaction
    await pool.query('BEGIN');

    // Insert user
    const userRes = await pool.query(`
      INSERT INTO users (name, email, password, role, requires_password_reset)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email;
    `, [name, email, hashedPassword, 'admin', false]);

    const userId = userRes.rows[0].id;

    // Check for IT department or first department
    const deptRes = await pool.query("SELECT id FROM departments WHERE department_name = 'IT' LIMIT 1");
    let deptId = deptRes.rows[0]?.id || null;
    if (!deptId) {
      const anyDept = await pool.query('SELECT id FROM departments LIMIT 1');
      deptId = anyDept.rows[0]?.id || null;
    }

    // Insert employee profile
    const empRes = await pool.query(`
      INSERT INTO employees (user_id, department_id, phone, address, designation, salary)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `, [userId, deptId, '9876543210', "Rishi's Emp system Technologies Office", 'System Administrator', 95000]);

    const empId = empRes.rows[0].id;

    // Insert initial leave balances
    await pool.query(`
      INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
      VALUES ($1, 12, 12, 15);
    `, [empId]);

    await pool.query('COMMIT');
    console.log('===================================================');
    console.log('🎉 Admin Account Created Successfully!');
    console.log(`👤 Name    : ${name}`);
    console.log(`📧 Email   : ${email}`);
    console.log('🔑 Role    : admin (System Administrator)');
    console.log('===================================================');
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Failed to create admin user:', err);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
