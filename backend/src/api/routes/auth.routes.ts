import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../../services/auth.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { UserRole } from '../../auth/roles.js';

export const authRouter = Router();

const loginSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4),
  role: z.nativeEnum(UserRole).optional(),
  name: z.string().optional(),
  nameEn: z.string().optional(),
  trade: z.string().optional(),
  city: z.string().optional(),
  experienceYears: z.number().optional(),
  dailyRate: z.number().optional(),
  isAvailable: z.boolean().optional(),
});

authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginOrRegisterWithPhone({
      ...data,
      ipAddress: req.ip,
      requestId: req.headers['x-request-id'] as string,
    });
    res.json({ success: true, data: result, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({ success: true, data: user, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
