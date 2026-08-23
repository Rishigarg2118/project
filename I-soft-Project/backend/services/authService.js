/**
 * Authentication Business Logic Service Layer
 * Connects User Repository with Encryption and Mail services.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepo from '../repositories/userRepository.js';
import * as empRepo from '../repositories/employeeRepository.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';
import { sendWelcomeEmail } from './emailService.js';
import logger from '../config/logger.js';

// Global counter for failed login monitoring
export let failedLoginsCounter = 0;
// Global counter for API requests (will increment this on endpoint hits)
export let apiRequestsCounter = 0;

export const incrementApiRequests = () => {
  apiRequestsCounter++;
};

export const registerUser = async ({ name, email, password, phone, role = 'user' }) => {
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  const existingPhone = await empRepo.findByPhone(phone);
  if (existingPhone) {
    const error = new Error('Phone number is already registered');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await userRepo.create({
    name,
    email,
    password: hashedPassword,
    role
  });

  // Create corresponding employee profile
  await empRepo.create({
    user_id: newUser.id,
    phone,
    designation: 'Staff',
    department_id: null,
    address: '',
    salary: 0
  });

  // Async trigger welcome email (fail-safe)
  sendWelcomeEmail(newUser.email, newUser.name).catch(err => {
    logger.error(`Failed to trigger welcome email: ${err.message}`);
  });

  return newUser;
};

export const loginUser = async ({ email, password }) => {
  const user = await userRepo.findByIdentifier(email);
  if (!user) {
    failedLoginsCounter++;
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    failedLoginsCounter++;
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Retrieve employee profiles mapping if exist
  const employee = await empRepo.findByUserId(user.id);

  return {
    token,
    role: user.role,
    requiresPasswordReset: user.requires_password_reset || false,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      employee_id: employee ? employee.id : null,
      requiresPasswordReset: user.requires_password_reset || false
    }
  };
};

export const getUserProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  const employee = await empRepo.findByUserId(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    employee_id: employee ? employee.id : null,
    phone: employee ? employee.phone : null,
    address: employee ? employee.address : null,
    designation: employee ? employee.designation : null,
    salary: employee ? employee.salary : null,
    department_name: employee ? employee.department_name : null
  };
};

export const requestPasswordReset = async (email) => {
  const user = await userRepo.findByIdentifier(email);
  if (!user) {
    const error = new Error('Identifier not registered');
    error.statusCode = 404;
    throw error;
  }

  // 6-digit OTP code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry

  await userRepo.updateResetCode(user.email, resetCode, expires);
  logger.info(`[PASSWORD RESET] Code for ${user.email} is ${resetCode}`);

  return resetCode;
};

export const verifyAndResetPassword = async ({ email, code, newPassword }) => {
  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    throw error;
  }

  const user = await userRepo.findByIdentifier(email);
  if (!user) {
    const error = new Error('Email not registered');
    error.statusCode = 404;
    throw error;
  }

  if (!user.reset_code || user.reset_code !== code) {
    const error = new Error('Invalid verification code');
    error.statusCode = 400;
    throw error;
  }

  if (new Date(user.reset_expires) < new Date()) {
    const error = new Error('Verification code has expired');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await userRepo.updatePassword(user.id, hashedPassword);
  logger.info(`Password successfully reset for user ${email}`);
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Incorrect current password');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await userRepo.updatePassword(userId, hashedPassword);
};
