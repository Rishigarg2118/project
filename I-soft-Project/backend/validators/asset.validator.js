import Joi from 'joi';
import { validateBody } from '../utils/validation.js';

export const assetSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  serial_number: Joi.string().min(2).max(100).required(),
  status: Joi.string().valid('available', 'allocated', 'maintenance').default('available'),
  description: Joi.string().allow('', null).optional(),
});

export const assetAllocationSchema = Joi.object({
  asset_id: Joi.number().integer().required(),
  employee_id: Joi.number().integer().required(),
  notes: Joi.string().allow('', null).optional(),
});

export const validateAsset = validateBody(assetSchema);
export const validateAssetAllocation = validateBody(assetAllocationSchema);
