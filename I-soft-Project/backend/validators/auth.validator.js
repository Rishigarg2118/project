import Joi from 'joi';
import { validateBody } from '../utils/validation.js';

export const userSignupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
    'any.only': 'Passwords do not match'
  }),
  phone: Joi.string().min(10).max(20).required()
});

export const userLoginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
});

export const validateSignup = validateBody(userSignupSchema);
export const validateLogin = validateBody(userLoginSchema);
export const validateReset = validateBody(resetPasswordSchema);

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});
export const validateChangePassword = validateBody(changePasswordSchema);
