import Joi from 'joi';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    next();
  };
};

export const userSignupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const departmentSchema = Joi.object({
  department_name: Joi.string().min(2).max(100).required(),
});

export const skillSchema = Joi.object({
  skill_name: Joi.string().min(2).max(100).required(),
});

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

export const attendanceCheckInSchema = Joi.object({
  location: Joi.string().max(100).required(),
  notes: Joi.string().allow('', null).optional(),
});
