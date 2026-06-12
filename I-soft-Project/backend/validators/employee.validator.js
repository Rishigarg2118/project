import Joi from 'joi';
import { validateBody } from '../utils/validation.js';

export const employeeSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  department_id: Joi.number().integer().allow(null).optional(),
  phone: Joi.string().allow('', null).max(20).optional(),
  address: Joi.string().allow('', null).optional(),
  designation: Joi.string().allow('', null).max(100).optional(),
  salary: Joi.number().min(0).allow(null).optional(),
  skill_ids: Joi.array().items(Joi.number().integer()).optional().default([]),
  images: Joi.array().items(Joi.object({
    label: Joi.string().required(),
    url: Joi.string().required()
  })).optional().default([]),
  role: Joi.string().valid('user', 'admin', 'hr', 'manager').optional()
});

export const validateEmployee = validateBody(employeeSchema);
