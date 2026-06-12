/**
 * Task 6 Migration — Database Indexing & Views Optimization
 * Run: node migrate-indexes-views.js
 */
import pool from './config/db.js';

async function migrate() {
  const client = await pool.connect();
  console.log('\n🚀 Task 6 Migration — Database Indexing & Views\n');

  try {
    await client.query('BEGIN');

    // ── 1. INDEXES (Query Optimization) ──────────────────────────────────
    console.log('  🔍 Creating database indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leaves_employee ON leaves(employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_allocations_ids ON asset_allocations(asset_id, employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attendance_checkin ON attendance(employee_id, check_in_time DESC);`);
    console.log('  ✅ Indexes successfully created');

    // ── 2. DATABASE VIEWS ────────────────────────────────────────────────
    console.log('  👁️ Creating database views...');
    
    // View 1: employee_dashboard_view
    await client.query(`
      CREATE OR REPLACE VIEW employee_dashboard_view AS
      SELECT 
        e.id AS employee_id,
        u.name AS employee_name,
        u.email,
        d.department_name,
        e.designation,
        e.salary,
        e.phone
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id;
    `);
    console.log('  ✅ employee_dashboard_view created');

    // View 2: leave_summary_view
    await client.query(`
      CREATE OR REPLACE VIEW leave_summary_view AS
      SELECT
        l.id AS leave_id,
        u.name AS employee_name,
        d.department_name,
        l.leave_type,
        l.start_date,
        l.end_date,
        (l.end_date - l.start_date + 1) AS total_days,
        l.reason,
        l.status,
        l.created_at
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id;
    `);
    console.log('  ✅ leave_summary_view created');

    // View 3: asset_summary_view
    await client.query(`
      CREATE OR REPLACE VIEW asset_summary_view AS
      SELECT
        a.id AS asset_id,
        a.name AS asset_name,
        a.serial_number,
        a.status AS asset_status,
        a.description,
        u.name AS allocated_to_name,
        aa.allocated_at,
        aa.notes
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.returned_at IS NULL
      LEFT JOIN employees e ON aa.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id;
    `);
    console.log('  ✅ asset_summary_view created');

    await client.query('COMMIT');
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  🎉 Database Indexes & Views Configured!');
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
