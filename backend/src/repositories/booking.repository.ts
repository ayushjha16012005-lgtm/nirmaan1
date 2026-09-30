import { prisma } from '../infrastructure/database.js';
import { BookingStatus, Prisma } from '@prisma/client';
import { AppError, ErrorCode } from '../utils/errors.js';

export class BookingRepository {
  async findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        worker: {
          include: { user: { select: { phone: true, email: true } } },
        },
        client: {
          include: { user: { select: { phone: true, email: true } } },
        },
        job: true,
        reviews: true,
      },
    });
  }

  async findByClientId(clientId: string) {
    return prisma.booking.findMany({
      where: { clientId },
      orderBy: { scheduledDate: 'desc' },
      include: {
        worker: true,
        job: true,
        reviews: true,
      },
    });
  }

  async findByWorkerId(workerId: string) {
    return prisma.booking.findMany({
      where: { workerId },
      orderBy: { scheduledDate: 'desc' },
      include: {
        client: true,
        job: true,
        reviews: true,
      },
    });
  }

  async findActiveBookingsOnDate(workerId: string, scheduledDate: Date) {
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.booking.findMany({
      where: {
        workerId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [
            BookingStatus.REQUESTED,
            BookingStatus.ACCEPTED,
            BookingStatus.CONFIRMED,
            BookingStatus.WORKER_ON_WAY,
            BookingStatus.ARRIVED,
            BookingStatus.IN_PROGRESS,
          ],
        },
      },
    });
  }

  /**
   * Atomic transactional booking creation with isolation and concurrent conflict protection
   */
  async createAtomicWithConflictCheck(
    data: Prisma.BookingCreateInput,
    workerId: string,
    scheduledDate: Date
  ) {
    return prisma.$transaction(async (tx) => {
      const startOfDay = new Date(scheduledDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(scheduledDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Check conflicts atomically inside the active transaction
      const existing = await tx.booking.findFirst({
        where: {
          workerId,
          scheduledDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            in: [
              BookingStatus.REQUESTED,
              BookingStatus.ACCEPTED,
              BookingStatus.CONFIRMED,
              BookingStatus.WORKER_ON_WAY,
              BookingStatus.ARRIVED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
      });

      if (existing) {
        throw new AppError(
          ErrorCode.BOOKING_CONFLICT,
          'Worker already has a scheduled or active booking on this date',
          409
        );
      }

      return tx.booking.create({
        data,
        include: {
          worker: true,
          client: true,
        },
      });
    });
  }

  async create(data: Prisma.BookingCreateInput) {
    return prisma.booking.create({
      data,
      include: {
        worker: true,
        client: true,
      },
    });
  }

  async updateStatus(id: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        worker: true,
        client: true,
      },
    });
  }
}

export const bookingRepository = new BookingRepository();
