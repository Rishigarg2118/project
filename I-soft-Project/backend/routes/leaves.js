import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, leaveRequestSchema, leaveReviewSchema } from '../utils/validation.js';
import * as leaveController from '../controllers/leaveController.js';

const router = express.Router();

// Apply for leave (All authenticated users with an employee profile)
router.post('/apply', verifyToken, validateBody(leaveRequestSchema), leaveController.applyLeave);

// Get my leave balances
router.get('/balances', verifyToken, leaveController.getMyBalances);

// Get my leave applications history
router.get('/my', verifyToken, leaveController.getMyLeaves);

// Get all applications queue (Admin / HR / Manager)
router.get('/queue', verifyToken, authorizeRoles('admin', 'hr', 'manager'), leaveController.getLeaveQueue);

// Review a leave application (Admin / HR / Manager)
router.put('/review/:id', verifyToken, authorizeRoles('admin', 'hr', 'manager'), validateBody(leaveReviewSchema), leaveController.reviewLeave);

// Get approval audit trail for a specific leave (Admin / HR / Manager)
router.get('/history/:leaveId', verifyToken, authorizeRoles('admin', 'hr', 'manager'), leaveController.getLeaveHistory);

// Leave reports and analytics — 5 advanced SQL datasets (Admin / HR / Manager)
router.get('/analytics', verifyToken, authorizeRoles('admin', 'hr', 'manager'), leaveController.getLeaveAnalytics);

export default router;
