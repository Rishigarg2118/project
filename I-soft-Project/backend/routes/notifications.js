import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import * as ns from '../services/notificationService.js';

const router = express.Router();

// GET /api/notifications — get my notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const notifications = await ns.getNotificationsForUser(req.user.id, 30);
    const unreadCount   = await ns.getUnreadCount(req.user.id);
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// PUT /api/notifications/:id/read — mark one as read
router.put('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const notification = await ns.markAsRead(req.params.id, req.user.id);
    res.json({ notification });
  } catch (err) { next(err); }
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', verifyToken, async (req, res, next) => {
  try {
    await ns.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

export default router;
