import pool from '../config/db.js';

export const allocateAsset = async (assetId, employeeId, notes) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if asset exists and is available
    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetRes.rowCount === 0) {
      throw new Error('Asset not found');
    }
    const asset = assetRes.rows[0];
    if (asset.status !== 'available') {
      throw new Error(`Asset is not available for allocation. Current status: ${asset.status}`);
    }

    // Check if employee exists
    const empRes = await client.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
    if (empRes.rowCount === 0) {
      throw new Error('Employee not found');
    }

    // Insert allocation log
    const allocationRes = await client.query(
      `INSERT INTO asset_allocations (asset_id, employee_id, notes, allocated_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [assetId, employeeId, notes || '']
    );

    // Update asset status
    await client.query(
      `UPDATE assets SET status = 'allocated' WHERE id = $1`,
      [assetId]
    );

    await client.query('COMMIT');
    return allocationRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const returnAsset = async (assetId, notes) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if asset is allocated
    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetRes.rowCount === 0) {
      throw new Error('Asset not found');
    }
    const asset = assetRes.rows[0];
    if (asset.status !== 'allocated') {
      throw new Error('Asset is not currently allocated');
    }

    // Find the active allocation
    const allocationRes = await client.query(
      `SELECT * FROM asset_allocations 
       WHERE asset_id = $1 AND returned_at IS NULL 
       ORDER BY allocated_at DESC LIMIT 1 FOR UPDATE`,
      [assetId]
    );
    if (allocationRes.rowCount === 0) {
      throw new Error('No active allocation record found for this asset');
    }
    const allocationId = allocationRes.rows[0].id;

    // Update allocation record
    await client.query(
      `UPDATE asset_allocations 
       SET returned_at = NOW(), notes = COALESCE($2, notes) 
       WHERE id = $1`,
      [allocationId, notes]
    );

    // Update asset status
    await client.query(
      `UPDATE assets SET status = 'available' WHERE id = $1`,
      [assetId]
    );

    await client.query('COMMIT');
    return { status: 'success', message: 'Asset returned successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getAssetHistory = async (assetId) => {
  const result = await pool.query(
    `SELECT aa.*, e.phone, u.name as employee_name, u.email as employee_email
     FROM asset_allocations aa
     JOIN employees e ON aa.employee_id = e.id
     JOIN users u ON e.user_id = u.id
     WHERE aa.asset_id = $1
     ORDER BY aa.allocated_at DESC`,
    [assetId]
  );
  return result.rows;
};
