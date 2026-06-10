import pool from '../config/db.js';
import * as assetService from '../services/assetService.js';

export const getAssets = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, 
             aa.employee_id, 
             u.name as allocated_to,
             aa.allocated_at
      FROM assets a
      LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.returned_at IS NULL
      LEFT JOIN employees e ON aa.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY a.id DESC
    `);
    res.json({ assets: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAssetById = async (req, res) => {
  const { id } = req.params;
  try {
    const assetRes = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (assetRes.rowCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const history = await assetService.getAssetHistory(id);
    res.json({ asset: assetRes.rows[0], history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAsset = async (req, res) => {
  const { name, serial_number, status, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO assets (name, serial_number, status, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, serial_number, status || 'available', description || '']
    );
    res.status(201).json({ asset: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Asset with this serial number already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

export const updateAsset = async (req, res) => {
  const { id } = req.params;
  const { name, serial_number, status, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE assets 
       SET name = $1, serial_number = $2, status = $3, description = $4 
       WHERE id = $5 RETURNING *`,
      [name, serial_number, status, description, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ asset: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAsset = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const allocateAsset = async (req, res) => {
  const { asset_id, employee_id, notes } = req.body;
  try {
    const allocation = await assetService.allocateAsset(asset_id, employee_id, notes);
    res.json({ message: 'Asset allocated successfully', allocation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const returnAsset = async (req, res) => {
  const { id } = req.params; // asset id
  const { notes } = req.body;
  try {
    const response = await assetService.returnAsset(id, notes);
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
