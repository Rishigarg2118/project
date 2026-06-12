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

    // Seed mock data
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const hrPassword = await bcrypt.hash('hr123', salt);
    const janePassword = await bcrypt.hash('jane123', salt);
    const rishiPassword = await bcrypt.hash('admin123', salt);

    const usersResult = await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES
        ('Admin User', 'admin@demo.com', $1, 'admin'),
        ('HR Manager', 'hr@demo.com', $2, 'hr'),
        ('Jane Smith', 'jane@demo.com', $3, 'user'),
        ('Rishi Garg', 'rishigarg1290@gmail.com', $4, 'admin')
      RETURNING id, email;
    `, [adminPassword, hrPassword, janePassword, rishiPassword]);

    const adminUser = usersResult.rows.find(u => u.email === 'admin@demo.com');
    const hrUser = usersResult.rows.find(u => u.email === 'hr@demo.com');
    const janeUser = usersResult.rows.find(u => u.email === 'jane@demo.com');
    const rishiUser = usersResult.rows.find(u => u.email === 'rishigarg1290@gmail.com');

    const deptsResult = await pool.query(`
      INSERT INTO departments (department_name)
      VALUES ('IT'), ('HR'), ('Finance'), ('Marketing')
      RETURNING id, department_name;
    `);
    const itDept = deptsResult.rows.find(d => d.department_name === 'IT');
    const hrDept = deptsResult.rows.find(d => d.department_name === 'HR');

    const skillsResult = await pool.query(`
      INSERT INTO skills (skill_name)
      VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java'), ('AWS'), ('TypeScript')
      RETURNING id, skill_name;
    `);
    const reactSkill = skillsResult.rows.find(s => s.skill_name === 'React');
    const nodeSkill = skillsResult.rows.find(s => s.skill_name === 'NodeJS');
    const pgSkill = skillsResult.rows.find(s => s.skill_name === 'PostgreSQL');
    const javaSkill = skillsResult.rows.find(s => s.skill_name === 'Java');

    // Seed Employee profiles
    const janeEmp = await pool.query(`
      INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
      VALUES ($1, $2, '9876543210', '123 MG Road, Gwalior', 'Senior Developer', 85000, NOW() - INTERVAL '150 days')
      RETURNING id;
    `, [janeUser.id, itDept.id]);

    const hrEmp = await pool.query(`
      INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
      VALUES ($1, $2, '9123456780', '45 Nehru Nagar, Delhi', 'HR Lead', 75000, NOW() - INTERVAL '200 days')
      RETURNING id;
    `, [hrUser.id, hrDept.id]);

    const rishiEmp = await pool.query(`
      INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
      VALUES ($1, $2, '9876543211', '123 MG Road, Gwalior', 'Director of Engineering', 120000, NOW() - INTERVAL '150 days')
      RETURNING id;
    `, [rishiUser.id, itDept.id]);

    const janeEmpId = janeEmp.rows[0].id;
    const hrEmpId = hrEmp.rows[0].id;
    const rishiEmpId = rishiEmp.rows[0].id;

    // Seed Employee images
    await pool.query(`
      INSERT INTO employee_images (employee_id, label, url)
      VALUES
        ($1, 'Profile Photo', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'),
        ($1, 'Aadhar Card', 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=150&q=80')
    `, [janeEmpId]);

    await pool.query(`
      INSERT INTO employee_images (employee_id, label, url)
      VALUES
        ($1, 'Profile Photo', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80')
    `, [hrEmpId]);

    // Seed Employee skills
    await pool.query(`
      INSERT INTO employee_skills (employee_id, skill_id)
      VALUES
        ($1, $2), ($1, $3), ($1, $4)
    `, [janeEmpId, reactSkill.id, nodeSkill.id, pgSkill.id]);

    await pool.query(`
      INSERT INTO employee_skills (employee_id, skill_id)
      VALUES
        ($1, $2)
    `, [hrEmpId, javaSkill.id]);

    // Seed leave balances
    await pool.query(`
      INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
      VALUES
        ($1, 10, 12, 15),
        ($2, 12, 12, 15),
        ($3, 12, 12, 15)
    `, [janeEmpId, hrEmpId, rishiEmpId]);

    // Seed leaves
    await pool.query(`
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, review_notes)
      VALUES ($1, 'sick', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'Fever and cold', 'approved', $2, 'Take rest');
    `, [janeEmpId, hrUser.id]);

    await pool.query(`
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
      VALUES ($1, 'casual', NOW() + INTERVAL '5 days', NOW() + INTERVAL '6 days', 'Family function', 'pending');
    `, [janeEmpId]);

    // Seed assets
    console.log('Seeding hardware assets...');
    const assetsData = [
      { name: 'MacBook Pro 16', serial: 'MAC-16-11001', status: 'allocated', desc: 'Apple M3 Max, 36GB RAM, 1TB SSD', empId: rishiEmpId, notes: 'Engineering Lead setup' },
      { name: 'MacBook Air 15', serial: 'MAC-15-11002', status: 'allocated', desc: 'Apple M3, 16GB RAM, 512GB SSD', empId: janeEmpId, notes: 'Senior Developer setup' },
      { name: 'Dell Latitude 5440', serial: 'DEL-LT-11004', status: 'allocated', desc: 'Intel Core i5, 16GB RAM, 512GB SSD', empId: hrEmpId, notes: 'HR Laptop' },
      { name: 'Dell UltraSharp 27 Monitor', serial: 'DEL-MON-11006', status: 'available', desc: '4K USB-C Hub Monitor', empId: null, notes: null },
      { name: 'iPad Pro 11', serial: 'APL-IPD-11007', status: 'available', desc: 'Apple M2 chip, 256GB WiFi', empId: null, notes: null },
      { name: 'Logitech MX Master 3S', serial: 'LOG-MS-11008', status: 'available', desc: 'Ergonomic Wireless Mouse', empId: null, notes: null },
      { name: 'ThinkPad T14 Gen 4', serial: 'LEN-TP-11009', status: 'maintenance', desc: 'Broken screen panel replacement pending', empId: null, notes: null }
    ];

    for (const a of assetsData) {
      const res = await pool.query(
        `INSERT INTO assets (name, serial_number, status, description)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [a.name, a.serial, a.status, a.desc]
      );
      const assetId = res.rows[0].id;
      
      if (a.status === 'allocated' && a.empId) {
        await pool.query(
          `INSERT INTO asset_allocations (asset_id, employee_id, notes, allocated_at)
           VALUES ($1, $2, $3, NOW() - INTERVAL '30 days')`,
          [assetId, a.empId, a.notes]
        );
      }
    }

    // Seed attendance
    console.log('Seeding realistic attendance logs...');
    const today = new Date();
    const activeEmpIds = [janeEmpId, hrEmpId, rishiEmpId];
    for (const empId of activeEmpIds) {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        
        // Skip weekends
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const checkInHour = 8.5 + Math.random() * 1.75;
        const checkInMin = Math.floor((checkInHour % 1) * 60);
        const checkInHr = Math.floor(checkInHour);
        const checkInDate = new Date(date);
        checkInDate.setHours(checkInHr, checkInMin, 0, 0);
        
        const checkOutHour = 17.0 + Math.random() * 2.5;
        const checkOutMin = Math.floor((checkOutHour % 1) * 60);
        const checkOutHr = Math.floor(checkOutHour);
        const checkOutDate = new Date(date);
        checkOutDate.setHours(checkOutHr, checkOutMin, 0, 0);
        
        const workedHours = parseFloat((checkOutHour - checkInHour).toFixed(2));
        const location = Math.random() > 0.3 ? 'Office - Gwalior' : 'Remote - Home';
        const notes = 'Daily check-in/out';
        
        await pool.query(
          `INSERT INTO attendance (employee_id, check_in_time, check_out_time, location, notes, worked_hours)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [empId, checkInDate, checkOutDate, location, notes, workedHours]
        );
      }
    }

    console.log('Seeded database successfully with test profiles, assets, leaves, and attendance.');
  } catch (error) {
    console.error('Failed to run database setups and seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

rebuildAndSeed().catch(console.error);
