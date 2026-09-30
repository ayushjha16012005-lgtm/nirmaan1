import { Router, Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../../repositories/notification.repository.js';
import { requireAuth } from '../../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationRepository.findByUserId(req.user!.userId);
    res.json({ success: true, data: notifications, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

notificationRouter.patch('/:id/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationRepository.markAsRead(req.params.id, req.user!.userId);
    res.json({ success: true, message: 'Notification marked as read', requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

notificationRouter.patch('/read-all', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationRepository.markAllAsRead(req.user!.userId);
    res.json({ success: true, message: 'All notifications marked as read', requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
