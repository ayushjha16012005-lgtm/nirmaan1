import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { UserRole } from '../../auth/roles.js';
import { Permission } from '../../auth/permissions.js';
import { reviewService } from '../../services/review.service.js';
import { AppError, ErrorCode } from '../../utils/errors.js';

export const createReviewTool: Tool = {
  name: 'create_review',
  description: 'Submit a 1-5 star review and comment for a completed booking',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT],
  permissions: [Permission.CREATE_REVIEW],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
  }),
  async execute(input, context) {
    if (!context.clientProfileId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Client profile not found in session', 401);
    }

    return reviewService.createReview({
      bookingId: input.bookingId,
      clientId: context.clientProfileId,
      rating: input.rating,
      comment: input.comment,
      userId: context.userId || undefined,
    });
  },
};

export const getWorkerReviewsTool: Tool = {
  name: 'get_reviews',
  description: 'Fetch reviews and ratings for a worker profile',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    workerId: z.string().uuid(),
  }),
  async execute(input) {
    return reviewService.getWorkerReviews(input.workerId);
  },
};
