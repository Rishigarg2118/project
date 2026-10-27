import bcrypt from 'bcryptjs';
import pool from './db.js';
import logger from './logger.js';

export async function initDatabase() {
  try {
    logger.info('Verifying database schema and initial setup...');

    // 1. Create tables if they do not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        department_name VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        skill_name VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        reset_code VARCHAR(6) NULL,
        reset_expires TIMESTAMP NULL,
        requires_password_reset BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        phone VARCHAR(20),
        address TEXT,
        designation VARCHAR(100),
        salary NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employee_images (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        label VARCHAR(100),
        url TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS employee_skills (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        UNIQUE (employee_id, skill_id)
      );

      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        serial_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'available',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS asset_allocations (
        id SERIAL PRIMARY KEY,
        asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        allocated_at TIMESTAMP DEFAULT NOW(),
        returned_at TIMESTAMP NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP NOT NULL DEFAULT NOW(),
        check_out_time TIMESTAMP NULL,
        location VARCHAR(100),
        notes TEXT,
        worked_hours NUMERIC(5,2)
      );

      CREATE TABLE IF NOT EXISTS leaves (
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

      CREATE TABLE IF NOT EXISTS leave_balances (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE UNIQUE,
        sick_leaves INTEGER DEFAULT 12,
        casual_leaves INTEGER DEFAULT 12,
        earned_leaves INTEGER DEFAULT 15
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        is_read    BOOLEAN DEFAULT FALSE,
        type       VARCHAR(50) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id           SERIAL PRIMARY KEY,
        table_name   VARCHAR(100) NOT NULL,
        action_type  VARCHAR(50)  NOT NULL,
        record_id    INT,
        old_data     JSONB,
        new_data     JSONB,
        performed_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS asset_history (
        id         SERIAL PRIMARY KEY,
        asset_id   INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        action     VARCHAR(100) NOT NULL,
        remarks    TEXT DEFAULT '',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS approval_history (
        id          SERIAL PRIMARY KEY,
        leave_id    INT NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
        action      VARCHAR(50) NOT NULL,
        acted_by    INT REFERENCES users(id) ON DELETE SET NULL,
        comments    TEXT,
        action_time TIMESTAMP DEFAULT NOW()
      );
    `);

    // 2. Ensure initial departments exist
    await pool.query(`
      INSERT INTO departments (department_name)
      VALUES ('IT'), ('HR'), ('Finance'), ('Marketing')
      ON CONFLICT (department_name) DO NOTHING;
    `);

    // 3. Ensure initial skills exist
    await pool.query(`
      INSERT INTO skills (skill_name)
      VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java'), ('AWS'), ('TypeScript')
      ON CONFLICT (skill_name) DO NOTHING;
    `);

    // 4. Ensure administrative accounts exist
    const salt = await bcrypt.genSalt(12);
    const adminPass123 = await bcrypt.hash('admin123', salt);
    const demoAdminPass = await bcrypt.hash('admin123456', salt);

    const defaultAdmins = [
      { name: 'Admin User', email: 'admin@demo.com', pass: adminPass123, role: 'admin' },
      { name: 'Rishi Garg', email: 'rishigarg@demo.com', pass: demoAdminPass, role: 'admin' },
      { name: 'Rishi Garg', email: 'rishigarg1290@gmail.com', pass: adminPass123, role: 'admin' }
    ];

    for (const adm of defaultAdmins) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adm.email]);
      let userId;
      if (existing.rows.length === 0) {
        const ins = await pool.query(`
          INSERT INTO users (name, email, password, role, requires_password_reset)
          VALUES ($1, $2, $3, $4, FALSE)
          RETURNING id
        `, [adm.name, adm.email, adm.pass, adm.role]);
        userId = ins.rows[0].id;
        logger.info(`Initialized default admin account: ${adm.email}`);
      } else {
        userId = existing.rows[0].id;
      }

      // Ensure employee record exists for admin
      const empExisting = await pool.query('SELECT id FROM employees WHERE user_id = $1', [userId]);
      if (empExisting.rows.length === 0) {
        const dept = await pool.query("SELECT id FROM departments WHERE department_name = 'IT' LIMIT 1");
        const deptId = dept.rows[0]?.id || null;
        const empIns = await pool.query(`
          INSERT INTO employees (user_id, department_id, phone, address, designation, salary)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [userId, deptId, '+91 9876543210', 'Headquarters', 'System Administrator', 100000]);
        const empId = empIns.rows[0].id;

        await pool.query(`
          INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
          VALUES ($1, 15, 15, 20)
          ON CONFLICT (employee_id) DO NOTHING
        `, [empId]);
      }
    }

    logger.info('Database schema and seed check completed successfully.');
  } catch (err) {
    logger.error(`Database auto-initialization error: ${err.message}`, { stack: err.stack });
    // Non-fatal so server can still respond with health/diagnostic status
  }
}
