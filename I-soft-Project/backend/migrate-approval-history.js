/**
 * Migration: Create approval_history audit trail table
 * Run once: node migrate-approval-history.js
 */
import pool from './config/db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migration: approval_history table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_history (
        id           SERIAL PRIMARY KEY,
        leave_id     INT NOT NULL REFERENCES leaves(id) ON DELETE CASCADE,
        approved_by  INT NOT NULL REFERENCES users(id),
        action       VARCHAR(50) NOT NULL,
        remarks      TEXT DEFAULT '',
        created_at   TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  ✅ Table approval_history created (or already exists)');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_history_leave_id ON approval_history(leave_id);
    `);
    console.log('  ✅ Index on approval_history(leave_id) created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leaves_employee_created ON leaves(employee_id, created_at);
    `);
    console.log('  ✅ Composite index on leaves(employee_id, created_at) created');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
