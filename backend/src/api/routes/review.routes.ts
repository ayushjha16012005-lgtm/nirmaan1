import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reviewService } from '../../services/review.service.js';
import { requireAuth } from '../../middleware/auth.js';

export const reviewRouter = Router();

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewRouter.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview({
      bookingId: data.bookingId,
      clientId: req.user!.clientProfileId || req.user!.userId,
      rating: data.rating,
      comment: data.comment,
      userId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: review, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});

reviewRouter.get('/worker/:workerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await reviewService.getWorkerReviews(req.params.workerId);
    res.json({ success: true, data: reviews, requestId: req.headers['x-request-id'] });
  } catch (err) {
    next(err);
  }
});
