import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_db';

const databaseUrl = new URL(DATABASE_URL);
const DATABASE_NAME = databaseUrl.pathname?.replace('/', '') || 'employee_db';
const ADMIN_DATABASE_URL = new URL(DATABASE_URL);
ADMIN_DATABASE_URL.pathname = '/postgres';

async function ensureDatabaseExists() {
  console.log(`Ensuring database "${DATABASE_NAME}" exists...`);
  const adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL.toString() });
  try {
    await adminPool.query(`CREATE DATABASE "${DATABASE_NAME}"`);
    console.log(`Created database "${DATABASE_NAME}".`);
  } catch (err) {
    if (err.code !== '42P04') {
      console.error('Error creating database:', err);
      throw err;
    } else {
      console.log(`Database "${DATABASE_NAME}" already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function rebuildAndSeed() {
  await ensureDatabaseExists();

  const pool = new Pool({ connectionString: DATABASE_URL });
  console.log('Connected to database. Starting table cleanups and builds...');

  try {
    // Drop existing tables in reverse order of dependencies
    await pool.query('DROP TABLE IF EXISTS leave_balances CASCADE;');
    await pool.query('DROP TABLE IF EXISTS leaves CASCADE;');
    await pool.query('DROP TABLE IF EXISTS attendance CASCADE;');
    await pool.query('DROP TABLE IF EXISTS asset_allocations CASCADE;');
    await pool.query('DROP TABLE IF EXISTS assets CASCADE;');
    await pool.query('DROP TABLE IF EXISTS employee_skills CASCADE;');
    await pool.query('DROP TABLE IF EXISTS employee_images CASCADE;');
    await pool.query('DROP TABLE IF EXISTS employees CASCADE;');
    await pool.query('DROP TABLE IF EXISTS skills CASCADE;');
    await pool.query('DROP TABLE IF EXISTS departments CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    console.log('Dropped existing tables.');

    // Create tables
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        reset_code VARCHAR(6) NULL,
        reset_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE skills (
        id SERIAL PRIMARY KEY,
        skill_name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        phone VARCHAR(20),
        address TEXT,
        designation VARCHAR(100),
        salary NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE employee_images (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        label VARCHAR(100),
        url TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE employee_skills (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE (employee_id, skill_id)
      );
    `);

    await pool.query(`
      CREATE TABLE assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE asset_allocations (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        allocated_at TIMESTAMP DEFAULT NOW(),
        returned_at TIMESTAMP NULL,
        notes TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
        check_out_time TIMESTAMP NULL,
        location VARCHAR(100),
        notes TEXT,
        worked_hours NUMERIC(5,2)
      );
    `);

    await pool.query(`
      CREATE TABLE leaves (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        leave_type VARCHAR(20) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE leave_balances (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
        sick_leaves INTEGER DEFAULT 12,
        casual_leaves INTEGER DEFAULT 12,
        earned_leaves INTEGER DEFAULT 15
      );
    `);

    console.log('Created database tables successfully.');

    // Seed clean administrative users and layout profiles
    const salt = await bcrypt.genSalt(10);
    const adminPassword123 = await bcrypt.hash('admin123', salt);
    const userPassword123456 = await bcrypt.hash('123456', salt);
    const hrPassword = await bcrypt.hash('hr123', salt);

    const adminUsers = [
      { name: 'Rishi Garg', email: 'rishigarg1290@gmail.com', password: adminPassword123, role: 'admin' },
      { name: 'Admin User', email: 'admin@demo.com', password: adminPassword123, role: 'admin' },
      { name: 'Pranay Gupta', email: 'pranay@isoftzone.com', password: userPassword123456, role: 'admin' },
      { name: 'Rahul Sharma', email: 'rahul@isoftzone.com', password: userPassword123456, role: 'manager' },
      { name: 'Priya Verma', email: 'priya@isoftzone.com', password: userPassword123456, role: 'hr' },
      { name: 'HR Manager', email: 'hr@demo.com', password: hrPassword, role: 'hr' }
    ];

    const usersResult = [];
    for (const u of adminUsers) {
      const res = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role;
      `, [u.name, u.email, u.password, u.role]);
      usersResult.push(res.rows[0]);
    }

    const deptsResult = await pool.query(`
      INSERT INTO departments (department_name)
      VALUES ('IT'), ('HR'), ('Finance'), ('Marketing')
      RETURNING id, department_name;
    `);
    const itDept = deptsResult.rows.find(d => d.department_name === 'IT');
    const hrDept = deptsResult.rows.find(d => d.department_name === 'HR');

    await pool.query(`
      INSERT INTO skills (skill_name)
      VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java'), ('AWS'), ('TypeScript');
    `);

    // Seed clean Employee profiles and initial leave balances
    for (const u of usersResult) {
      const deptId = (u.role === 'hr') ? hrDept.id : itDept.id;
      const designation = (u.name === 'Rishi Garg') ? 'Director of Engineering' :
                          (u.role === 'admin') ? 'System Administrator' :
                          (u.role === 'manager') ? 'IT Manager' : 'HR Specialist';
      const salary = (u.name === 'Rishi Garg') ? 120000 :
                     (u.role === 'admin') ? 95000 :
                     (u.role === 'manager') ? 85000 : 70000;

      const empRes = await pool.query(`
        INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
        VALUES ($1, $2, '9876543210', 'i-SOFTZONE Technologies Office', $3, $4, NOW())
        RETURNING id;
      `, [u.id, deptId, designation, salary]);

      const empId = empRes.rows[0].id;

      await pool.query(`
        INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
        VALUES ($1, 12, 12, 15)
      `, [empId]);
    }

    console.log('Seeded database successfully with clean administrative profiles (0 sample logs/leaves/assets).');
  } catch (error) {
    console.error('Failed to run database setups and seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

rebuildAndSeed().catch(console.error);
