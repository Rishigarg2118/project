import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, attendanceCheckInSchema } from '../utils/validation.js';
import * as attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

// Clock In (All roles)
router.post('/check-in', verifyToken, validateBody(attendanceCheckInSchema), attendanceController.checkIn);

// Clock Out (All roles)
router.post('/check-out', verifyToken, attendanceController.checkOut);

// Get my today's status
router.get('/today-status', verifyToken, attendanceController.getMyTodayStatus);

// Get my check-in logs
router.get('/my-logs', verifyToken, attendanceController.getMyLogs);

// Get all logs (Admin / HR)
router.get('/all-logs', verifyToken, authorizeRoles('admin', 'hr'), attendanceController.getAllLogs);

export default router;
