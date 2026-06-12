/**
 * Authentication Controllers
 * Binds routes to authService methods. Intercepts inputs and handles responses.
 */
import * as authService from '../services/authService.js';

export const register = async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  try {
    const user = await authService.registerUser({ name, email, password, phone });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await authService.loginUser({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const userProfile = await authService.getUserProfile(req.user.id);
    res.json({ user: userProfile });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const resetCode = await authService.requestPasswordReset(email);
    res.json({
      message: 'Password reset verification code generated',
      resetCode
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  try {
    await authService.verifyAndResetPassword({ email, code, newPassword });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};
