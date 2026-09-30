import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { jobService } from '../../services/job.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { UserRole } from '../../auth/roles.js';
import { JobStatus, ApplicationStatus } from '@prisma/client';

export const jobRouter = Router();

jobRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trade, city, status, limit, offset } = req.query;
    const result = await jobService.searchJobs({
      trade: trade ? String(trade) : undefined,
      city: city ? String(city) : undefined,
      status: status ? (status as JobStatus) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

jobRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await jobService.getJobById(req.params.id);
    res.json({ success: true, data: job, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  tradeRequired: z.string(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  scheduledDate: z.string(),
  city: z.string().optional(),
  address: z.string().optional(),
});

jobRouter.post('/', requireAuth, requireRole(UserRole.CLIENT, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createJobSchema.parse(req.body);
    const job = await jobService.createJob({
      clientId: req.user!.clientProfileId || req.user!.userId,
      title: data.title,
      description: data.description,
      tradeRequired: data.tradeRequired,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      scheduledDate: data.scheduledDate,
      location: data.city && data.address ? {
        city: data.city,
        address: data.address,
        latitude: 28.5355,
        longitude: 77.3910,
      } : undefined,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: job, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const applyJobSchema = z.object({
  proposedRate: z.number().optional(),
  coverNote: z.string().optional(),
});

jobRouter.post('/:id/applications', requireAuth, requireRole(UserRole.WORKER), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = applyJobSchema.parse(req.body);
    const application = await jobService.applyForJob({
      jobId: req.params.id,
      workerId: req.user!.workerProfileId!,
      proposedRate: data.proposedRate,
      coverNote: data.coverNote,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: application, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
