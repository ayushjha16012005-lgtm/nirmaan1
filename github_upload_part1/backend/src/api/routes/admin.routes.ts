import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '../../services/admin.service.js';
import { workerService } from '../../services/worker.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { UserRole } from '../../auth/roles.js';

export const adminRouter = Router();

// All admin routes require ADMIN role
adminRouter.use(requireAuth, requireRole(UserRole.ADMIN));

adminRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/workers/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pending = await workerService.getPendingWorkers();
    res.json({ success: true, data: pending, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/workers/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminService.approveWorker(req.params.id, req.user?.userId);
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const rejectSchema = z.object({
  reason: z.string().optional(),
});

adminRouter.post('/workers/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = rejectSchema.parse(req.body);
    const result = await adminService.rejectWorker(req.params.id, reason, req.user?.userId);
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const suspendSchema = z.object({
  reason: z.string().optional(),
});

adminRouter.post('/users/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = suspendSchema.parse(req.body);
    const result = await adminService.suspendUser(req.params.id, reason, req.user?.userId);
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

adminRouter.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await adminService.getAuditLogs(limit);
    res.json({ success: true, data: logs, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
