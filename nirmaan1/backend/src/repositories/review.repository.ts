import { prisma } from '../infrastructure/database.js';

export class ReviewRepository {
  async findByWorkerId(workerId: string) {
    return prisma.review.findMany({
      where: { workerId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, city: true } },
      },
    });
  }

  async findByBookingId(bookingId: string) {
    return prisma.review.findUnique({
      where: { bookingId },
    });
  }

  async create(data: {
    bookingId?: string;
    jobId?: string;
    workerId: string;
    clientId: string;
    rating: number;
    comment?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          rating: data.rating,
          comment: data.comment,
          worker: { connect: { id: data.workerId } },
          client: { connect: { id: data.clientId } },
          ...(data.bookingId ? { booking: { connect: { id: data.bookingId } } } : {}),
          ...(data.jobId ? { job: { connect: { id: data.jobId } } } : {}),
        },
      });

      // Recalculate aggregate worker rating
      const aggregate = await tx.review.aggregate({
        where: { workerId: data.workerId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.workerProfile.update({
        where: { id: data.workerId },
        data: {
          rating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
          ratingCount: aggregate._count.rating,
          totalJobs: { increment: 1 },
        },
      });

      return review;
    });
  }
}

export const reviewRepository = new ReviewRepository();
