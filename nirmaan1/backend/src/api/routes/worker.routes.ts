import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { workerService } from '../../services/worker.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { UserRole } from '../../auth/roles.js';

export const workerRouter = Router();

workerRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trade, city, maxDailyRate, minRating, availableOnly, searchQuery, limit, offset } = req.query;
    const result = await workerService.searchWorkers({
      trade: trade ? String(trade) : undefined,
      city: city ? String(city) : undefined,
      maxDailyRate: maxDailyRate ? Number(maxDailyRate) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      availableOnly: availableOnly === 'true',
      searchQuery: searchQuery ? String(searchQuery) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

workerRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await workerService.getWorkerById(req.params.id);
    res.json({ success: true, data: worker, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  nameEn: z.string().optional(),
  trade: z.string().optional(),
  bio: z.string().optional(),
  dailyRate: z.number().min(100).optional(),
  city: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

workerRouter.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await workerService.updateProfile(req.params.id, data, req.user?.userId);
    res.json({ success: true, data: updated, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
