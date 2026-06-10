/**
 * Day 5 Migration — Enterprise Features
 * Creates: notifications, audit_logs, asset_history tables
 * Creates: employee_summary VIEW
 * Creates: calculate_leave_balance() stored procedure
 * Run: node migrate-day5.js
 */
import pool from './config/db.js';

async function migrate() {
  const client = await pool.connect();
  console.log('\n🚀 Day 5 Migration — Enterprise Features\n');

  try {
    await client.query('BEGIN');

    // ── 1. NOTIFICATIONS TABLE ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(200) NOT NULL,
        message    TEXT NOT NULL,
        is_read    BOOLEAN DEFAULT FALSE,
        type       VARCHAR(50) DEFAULT 'info',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);`);
    console.log('  ✅ notifications table created');

    // ── 2. AUDIT LOGS TABLE (JSONB) ────────────────────────────────────────
    await client.query(`
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
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_performer ON audit_logs(performed_by, created_at DESC);`);
    console.log('  ✅ audit_logs table (JSONB) created');

    // ── 3. ASSET HISTORY TABLE ────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS asset_history (
        id         SERIAL PRIMARY KEY,
        asset_id   INT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
        action     VARCHAR(100) NOT NULL,
        remarks    TEXT DEFAULT '',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history(asset_id);`);
    console.log('  ✅ asset_history table created');

    // ── 4. POSTGRESQL VIEW: employee_summary ─────────────────────────────
    await client.query(`
      CREATE OR REPLACE VIEW employee_summary AS
      SELECT
        u.id                          AS user_id,
        u.name                        AS employee_name,
        u.email,
        u.role,
        d.department_name,
        e.designation,
        e.salary,
        e.phone,
        e.id                          AS employee_id,
        COUNT(DISTINCT es.skill_id)   AS skill_count,
        COUNT(DISTINCT l.id)          AS total_leave_requests,
        COUNT(DISTINCT CASE WHEN l.status = 'approved' THEN l.id END) AS approved_leaves,
        COUNT(DISTINCT CASE WHEN l.status = 'pending'  THEN l.id END) AS pending_leaves
      FROM users u
      JOIN employees e         ON e.user_id       = u.id
      LEFT JOIN departments d  ON e.department_id = d.id
      LEFT JOIN employee_skills es ON es.employee_id = e.id
      LEFT JOIN leaves l       ON l.employee_id   = e.id
      GROUP BY u.id, u.name, u.email, u.role, d.department_name, e.designation, e.salary, e.phone, e.id;
    `);
    console.log('  ✅ employee_summary VIEW created');

    // ── 5. STORED PROCEDURE: calculate_leave_balance ─────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_leave_balance(p_employee_id INT)
      RETURNS TABLE(
        leave_type     TEXT,
        total_allotted INT,
        used_days      INT,
        remaining_days INT
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          'Casual Leave'::TEXT                  AS leave_type,
          lb.casual_leaves                      AS total_allotted,
          COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / 86400 + 1)::INT
            FROM leaves
            WHERE employee_id = p_employee_id
              AND leave_type  = 'casual'
              AND status      = 'approved'
          ), 0)                                 AS used_days,
          lb.casual_leaves - COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / 86400 + 1)::INT
            FROM leaves
            WHERE employee_id = p_employee_id
              AND leave_type  = 'casual'
              AND status      = 'approved'
          ), 0)                                 AS remaining_days
        FROM leave_balances lb
        WHERE lb.employee_id = p_employee_id
        UNION ALL
        SELECT
          'Sick Leave'::TEXT,
          lb.sick_leaves,
          COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / 86400 + 1)::INT
            FROM leaves
            WHERE employee_id = p_employee_id
              AND leave_type  = 'sick'
              AND status      = 'approved'
          ), 0),
          lb.sick_leaves - COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (end_date::timestamp - start_date::timestamp)) / 86400 + 1)::INT
            FROM leaves
            WHERE employee_id = p_employee_id
              AND leave_type  = 'sick'
              AND status      = 'approved'
          ), 0)
        FROM leave_balances lb
        WHERE lb.employee_id = p_employee_id
        UNION ALL
        SELECT
          'Earned Leave'::TEXT,
          lb.earned_leaves,
          0,
          lb.earned_leaves
        FROM leave_balances lb
        WHERE lb.employee_id = p_employee_id;
      END;
      $$;
    `);
    console.log('  ✅ calculate_leave_balance() stored procedure created');

    await client.query('COMMIT');

    console.log('\n' + '═'.repeat(55));
    console.log('  🎉 Day 5 Migration Complete!');
    console.log('═'.repeat(55));
    console.log('  Tables  : notifications, audit_logs, asset_history');
    console.log('  View    : employee_summary');
    console.log('  Proc    : calculate_leave_balance(employee_id)');
    console.log('═'.repeat(55) + '\n');

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
