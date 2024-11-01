// Notifications API Routes
import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notificationService';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread_only === 'true';
    const notifications = await notificationService.getUserNotifications(
      req.user!.id,
      unreadOnly
    );
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// GET /api/notifications/count - Get unread notification count
router.get('/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// PATCH /api/notifications/:notificationId/read - Mark notification as read
router.patch('/:notificationId/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid notification ID' });
      return;
    }
    
    const notification = await notificationService.markNotificationAsRead(
      notificationId,
      req.user!.id
    );
    res.json(notification);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: 'NotFound', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'InternalServerError', message: error.message });
  }
});

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.notificationId);
    if (isNaN(notificationId)) {
      res.status(400).json({ error: 'BadRequest', message: 'Invalid notification ID' });
      return;
    }
    
    await notificationService.deleteNotification(notificationId, req.user!.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: 'NotFound', message: error.message });
    } else {
      res.status(500).json({ error: 'InternalServerError', message: error.message });
    }
  }
});

export default router;
