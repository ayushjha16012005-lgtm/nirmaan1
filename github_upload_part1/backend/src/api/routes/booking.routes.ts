import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from '../../services/booking.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { BookingStatus, UserRole } from '@prisma/client';

export const bookingRouter = Router();

const createBookingSchema = z.object({
  workerId: z.string().uuid(),
  scheduledDate: z.string(),
  scheduledTime: z.string().optional(),
  agreedRate: z.number().optional(),
  notes: z.string().optional(),
  jobId: z.string().uuid().optional(),
});

bookingRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBookingSchema.parse(req.body);
    const booking = await bookingService.createBooking({
      clientId: req.user!.clientProfileId || req.user!.userId,
      workerId: data.workerId,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      agreedRate: data.agreedRate,
      notes: data.notes,
      jobId: data.jobId,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: booking, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

bookingRouter.get('/my', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === UserRole.WORKER && req.user!.workerProfileId) {
      const bookings = await bookingService.getWorkerBookings(req.user!.workerProfileId);
      return res.json({ success: true, data: bookings, requestId: req.headers['x-request-id'] });
    }
    if (req.user!.clientProfileId) {
      const bookings = await bookingService.getClientBookings(req.user!.clientProfileId);
      return res.json({ success: true, data: bookings, requestId: req.headers['x-request-id'] });
    }
    res.json({ success: true, data: [], requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

bookingRouter.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user!.userId,
      req.user!.role as any
    );
    res.json({ success: true, data: booking, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
});

bookingRouter.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = updateStatusSchema.parse(req.body);
    const updated = await bookingService.updateBookingStatus(
      req.params.id,
      status,
      req.user!.userId,
      req.user!.role as any
    );
    res.json({ success: true, data: updated, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
