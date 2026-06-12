/**
 * Asset Service — Business Logic Layer
 * Incorporates Repository pattern, Audit Trail (auditService), and Notifications (notificationService).
 */
import pool from '../config/db.js';
import * as repo from '../repositories/assetRepository.js';
import { auditLog } from './auditService.js';
import * as ns from './notificationService.js';

export const getAssets = async (filters) => {
  return await repo.findAll(filters);
};

export const getAssetById = async (id) => {
  return await repo.findById(id);
};

export const getAssetHistory = async (assetId) => {
  return await repo.getHistory(assetId);
};

export const createAsset = async (assetData, performedBy) => {
  const asset = await repo.create(assetData);
  
  // Log asset creation in history and audit logs
  await repo.createHistory(null, {
    asset_id: asset.id,
    action: 'CREATED',
    remarks: `Asset "${asset.name}" created under inventory.`,
    created_by: performedBy
  });

  await auditLog(null, 'assets', 'INSERT', asset.id, null, asset, performedBy);
  
  return asset;
};

export const updateAsset = async (id, assetData, performedBy) => {
  const oldAsset = await repo.findById(id);
  if (!oldAsset) {
    throw new Error('Asset not found');
  }

  const newAsset = await repo.update(id, assetData);

  // Log in history & audit logs
  await repo.createHistory(null, {
    asset_id: id,
    action: 'UPDATED',
    remarks: `Asset details updated. Status changed: ${oldAsset.status} -> ${newAsset.status}`,
    created_by: performedBy
  });

  await auditLog(null, 'assets', 'UPDATE', id, oldAsset, newAsset, performedBy);

  return newAsset;
};

export const deleteAsset = async (id, performedBy) => {
  const oldAsset = await repo.findById(id);
  if (!oldAsset) {
    throw new Error('Asset not found');
  }

  const deletedAsset = await repo.remove(id);
  await auditLog(null, 'assets', 'DELETE', id, oldAsset, null, performedBy);

  return deletedAsset;
};

export const allocateAsset = async (assetId, employeeId, notes, performedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch asset with lock
    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetRes.rowCount === 0) {
      throw new Error('Asset not found');
    }
    const asset = assetRes.rows[0];
    if (asset.status !== 'available') {
      throw new Error(`Asset is not available for allocation. Current status: ${asset.status}`);
    }

    // 2. Fetch employee details (user_id is needed for notification)
    const empRes = await client.query(
      `SELECT e.id, e.user_id, u.name 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = $1`, 
      [employeeId]
    );
    if (empRes.rowCount === 0) {
      throw new Error('Employee not found');
    }
    const employee = empRes.rows[0];

    // 3. Insert allocation record
    const allocation = await repo.createAllocation(client, {
      asset_id: assetId,
      employee_id: employeeId,
      notes
    });

    // 4. Update asset status to 'allocated'
    const updatedAsset = await repo.update(assetId, { ...asset, status: 'allocated' });

    // 5. Create Asset History
    await repo.createHistory(client, {
      asset_id: assetId,
      action: 'ALLOCATED',
      remarks: `Allocated to ${employee.name}. Notes: ${notes || 'None'}`,
      created_by: performedBy
    });

    // 6. Write to Audit Trail (JSONB)
    await auditLog(client, 'assets', 'UPDATE', assetId, asset, updatedAsset, performedBy);
    await auditLog(client, 'asset_allocations', 'INSERT', allocation.id, null, allocation, performedBy);

    // 7. Fire Notification
    await ns.notifyAssetAssigned(client, employee.user_id, asset.name);

    await client.query('COMMIT');
    return allocation;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const returnAsset = async (assetId, notes, performedBy) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch asset with lock
    const assetRes = await client.query('SELECT * FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetRes.rowCount === 0) {
      throw new Error('Asset not found');
    }
    const asset = assetRes.rows[0];
    if (asset.status !== 'allocated') {
      throw new Error('Asset is not currently allocated');
    }

    // 2. Fetch active allocation with lock
    const allocation = await repo.findActiveAllocation(client, assetId);
    if (!allocation) {
      throw new Error('No active allocation record found for this asset');
    }

    // 3. Fetch employee details (user_id for notification)
    const empRes = await client.query(
      `SELECT e.id, e.user_id, u.name 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = $1`, 
      [allocation.employee_id]
    );
    if (empRes.rowCount === 0) {
      throw new Error('Employee profile not found');
    }
    const employee = empRes.rows[0];

    // 4. Update allocation record (returned_at = NOW)
    const updatedAllocation = await repo.updateAllocation(client, allocation.id, {
      returned_at: new Date(),
      notes: notes || 'Returned to storage'
    });

    // 5. Update asset status to 'available'
    const updatedAsset = await repo.update(assetId, { ...asset, status: 'available' });

    // 6. Create Asset History
    await repo.createHistory(client, {
      asset_id: assetId,
      action: 'RETURNED',
      remarks: `Returned by ${employee.name}. Remarks: ${notes || 'Returned to storage'}`,
      created_by: performedBy
    });

    // 7. Write to Audit Trail (JSONB)
    await auditLog(client, 'assets', 'UPDATE', assetId, asset, updatedAsset, performedBy);
    await auditLog(client, 'asset_allocations', 'UPDATE', allocation.id, allocation, updatedAllocation, performedBy);

    // 8. Fire Notification
    await ns.notifyAssetReturned(employee.user_id, asset.name);

    await client.query('COMMIT');
    return { status: 'success', message: 'Asset returned successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
