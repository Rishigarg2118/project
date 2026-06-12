/**
 * Asset Controller
 * Connects routes to the Asset Service layer.
 */
import * as assetService from '../services/assetService.js';

export const getAssets = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    const result = await assetService.getAssets({ search, status, page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const asset = await assetService.getAssetById(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const history = await assetService.getAssetHistory(id);
    res.json({ asset, history });
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req, res, next) => {
  const { name, serial_number, status, description } = req.body;
  try {
    const asset = await assetService.createAsset({ name, serial_number, status, description }, req.user.id);
    res.status(201).json({ asset });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  const { id } = req.params;
  const { name, serial_number, status, description } = req.body;
  try {
    const asset = await assetService.updateAsset(id, { name, serial_number, status, description }, req.user.id);
    res.json({ asset });
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req, res, next) => {
  const { id } = req.params;
  try {
    await assetService.deleteAsset(id, req.user.id);
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const allocateAsset = async (req, res, next) => {
  const { asset_id, employee_id, notes } = req.body;
  try {
    const allocation = await assetService.allocateAsset(asset_id, employee_id, notes, req.user.id);
    res.json({ message: 'Asset allocated successfully', allocation });
  } catch (error) {
    next(error);
  }
};

export const returnAsset = async (req, res, next) => {
  const { id } = req.params; // asset id
  const { notes } = req.body;
  try {
    const response = await assetService.returnAsset(id, notes, req.user.id);
    res.json(response);
  } catch (error) {
    next(error);
  }
};
