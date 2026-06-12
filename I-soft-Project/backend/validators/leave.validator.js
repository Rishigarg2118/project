import Joi from 'joi';
import { validateBody } from '../utils/validation.js';

export const leaveRequestSchema = Joi.object({
  leave_type: Joi.string().valid('sick', 'casual', 'earned').required(),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  reason: Joi.string().min(5).required(),
});

export const leaveReviewSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  review_notes: Joi.string().allow('', null).optional(),
});

export const validateLeaveRequest = validateBody(leaveRequestSchema);
export const validateLeaveReview = validateBody(leaveReviewSchema);
