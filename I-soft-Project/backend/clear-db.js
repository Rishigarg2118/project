import pool from './config/db.js';
import bcrypt from 'bcryptjs';

async function cleanDatabase() {
  const client = await pool.connect();
  console.log('\n🧹 Starting Database Cleanup (Removing Sample Data)...\n');

  try {
    await client.query('BEGIN');

    // 1. DELETE all sample data from tables
    console.log('🗑️  Deleting sample records...');
    await client.query('DELETE FROM approval_history');
    await client.query('DELETE FROM leaves');
    await client.query('DELETE FROM leave_balances');
    await client.query('DELETE FROM attendance');
    await client.query('DELETE FROM asset_allocations');
    await client.query('DELETE FROM assets');
    await client.query('DELETE FROM employee_images');
    await client.query('DELETE FROM employee_skills');
    await client.query('DELETE FROM employees');
    await client.query('DELETE FROM skills');
    await client.query('DELETE FROM departments');
    await client.query('DELETE FROM users');
    console.log('   ✅ All sample data tables cleared.');

    // 2. Reset ID sequences
    console.log('🔄 Resetting auto-increment sequences...');
    await client.query(`SELECT setval('users_id_seq', 1, false)`);
    await client.query(`SELECT setval('departments_id_seq', 1, false)`);
    await client.query(`SELECT setval('skills_id_seq', 1, false)`);
    await client.query(`SELECT setval('employees_id_seq', 1, false)`);
    await client.query(`SELECT setval('leaves_id_seq', 1, false)`);
    await client.query(`SELECT setval('leave_balances_id_seq', 1, false)`);
    await client.query(`SELECT setval('approval_history_id_seq', 1, false)`);
    await client.query(`SELECT setval('assets_id_seq', 1, false)`);
    await client.query(`SELECT setval('asset_allocations_id_seq', 1, false)`);
    await client.query(`SELECT setval('attendance_id_seq', 1, false)`);
    await client.query(`SELECT setval('employee_images_id_seq', 1, false)`);
    await client.query(`SELECT setval('employee_skills_id_seq', 1, false)`);
    console.log('   ✅ Sequences reset.');

    // 3. Re-insert administrative users & lookup data
    console.log('👥 Seeding clean administrative accounts...');
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
      const res = await client.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
        [u.name, u.email, u.password, u.role]
      );
      usersResult.push(res.rows[0]);
    }
    console.log('   ✅ Administrative accounts created.');

    console.log('🏢 Seeding clean lookup tables...');
    const deptsResult = await client.query(`
      INSERT INTO departments (department_name)
      VALUES ('IT'), ('HR'), ('Finance'), ('Marketing')
      RETURNING id, department_name;
    `);
    const itDept = deptsResult.rows.find(d => d.department_name === 'IT');
    const hrDept = deptsResult.rows.find(d => d.department_name === 'HR');

    await client.query(`
      INSERT INTO skills (skill_name)
      VALUES ('React'), ('NodeJS'), ('PostgreSQL'), ('Python'), ('Java'), ('AWS'), ('TypeScript');
    `);
    console.log('   ✅ Departments and skills created.');

    console.log('👤 Seeding employee profiles...');
    // Seed clean Employee profiles and initial leave balances
    for (const u of usersResult) {
      const deptId = (u.role === 'hr') ? hrDept.id : itDept.id;
      const designation = (u.name === 'Rishi Garg') ? 'Director of Engineering' :
                          (u.role === 'admin') ? 'System Administrator' :
                          (u.role === 'manager') ? 'IT Manager' : 'HR Specialist';
      const salary = (u.name === 'Rishi Garg') ? 120000 :
                     (u.role === 'admin') ? 95000 :
                     (u.role === 'manager') ? 85000 : 70000;

      const empRes = await client.query(`
        INSERT INTO employees (user_id, department_id, phone, address, designation, salary, created_at)
        VALUES ($1, $2, '9876543210', 'i-SOFTZONE Technologies Office', $3, $4, NOW())
        RETURNING id;
      `, [u.id, deptId, designation, salary]);

      const empId = empRes.rows[0].id;

      await client.query(`
        INSERT INTO leave_balances (employee_id, sick_leaves, casual_leaves, earned_leaves)
        VALUES ($1, 12, 12, 15)
      `, [empId]);
    }
    console.log('   ✅ Employee profiles and leave balances set.');

    await client.query('COMMIT');
    console.log('\n🎉 Database cleanup successful! Only administrative profiles remain.');
    console.log('\nActive Credentials:');
    console.log('  - rishigarg1290@gmail.com (admin123)');
    console.log('  - admin@demo.com (admin123)');
    console.log('  - pranay@isoftzone.com (123456)');
    console.log('  - rahul@isoftzone.com (123456)');
    console.log('  - priya@isoftzone.com (123456)');
    console.log('  - hr@demo.com (hr123)\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Cleanup failed, database changes rolled back:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanDatabase();
