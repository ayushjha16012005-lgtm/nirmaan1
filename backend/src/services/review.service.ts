import { reviewRepository } from '../repositories/review.repository.js';
import { bookingRepository } from '../repositories/booking.repository.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { BookingStatus } from '@prisma/client';

export class ReviewService {
  async createReview(params: {
    bookingId: string;
    clientId: string;
    rating: number;
    comment?: string;
    userId?: string;
  }) {
    if (params.rating < 1 || params.rating > 5) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Rating must be between 1 and 5', 400);
    }

    const booking = await bookingRepository.findById(params.bookingId);
    if (!booking) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Booking not found', 404);
    }

    if (booking.clientId !== params.clientId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Only the client who booked the worker can review', 403);
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Reviews can only be submitted for COMPLETED bookings',
        400
      );
    }

    const existing = await reviewRepository.findByBookingId(params.bookingId);
    if (existing) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'A review has already been submitted for this booking', 409);
    }

    return reviewRepository.create({
      bookingId: params.bookingId,
      workerId: booking.workerId,
      clientId: params.clientId,
      rating: params.rating,
      comment: params.comment,
    });
  }

  async getWorkerReviews(workerId: string) {
    return reviewRepository.findByWorkerId(workerId);
  }
}

export const reviewService = new ReviewService();
