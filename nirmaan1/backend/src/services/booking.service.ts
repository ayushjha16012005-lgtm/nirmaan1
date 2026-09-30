import { bookingRepository } from '../repositories/booking.repository.js';
import { workerRepository } from '../repositories/worker.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { BookingStatus, VerificationStatus, UserRole } from '@prisma/client';

export class BookingService {
  async createBooking(params: {
    clientId: string;
    workerId: string;
    scheduledDate: string | Date;
    scheduledTime?: string;
    agreedRate?: number;
    notes?: string;
    jobId?: string;
    userId?: string;
  }) {
    // 1. Check worker verification status and existence
    const worker = await workerRepository.findById(params.workerId);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker not found', 404);
    }

    if (worker.verificationStatus !== VerificationStatus.APPROVED) {
      throw new AppError(
        ErrorCode.WORKER_NOT_APPROVED,
        'Cannot book a worker whose profile is not approved',
        400
      );
    }

    if (!worker.isAvailable) {
      throw new AppError(
        ErrorCode.WORKER_UNAVAILABLE,
        'Worker is currently marked as unavailable',
        400
      );
    }

    const scheduledDateObj = new Date(params.scheduledDate);
    const agreedRate = params.agreedRate || worker.dailyRate;

    // 2. Atomic Transactional Conflict Check & Creation
    const booking = await bookingRepository.createAtomicWithConflictCheck(
      {
        client: { connect: { id: params.clientId } },
        worker: { connect: { id: params.workerId } },
        scheduledDate: scheduledDateObj,
        scheduledTime: params.scheduledTime || '09:00',
        agreedRate,
        notes: params.notes,
        ...(params.jobId ? { job: { connect: { id: params.jobId } } } : {}),
        status: BookingStatus.REQUESTED,
      },
      params.workerId,
      scheduledDateObj
    );

    // 3. Notify Worker
    if (worker.userId) {
      await notificationRepository.create({
        userId: worker.userId,
        title: 'New Booking Request',
        message: `You have received a new booking request for ${scheduledDateObj.toLocaleDateString()} at rate ₹${agreedRate}.`,
        type: 'BOOKING_REQUESTED',
        data: { bookingId: booking.id },
      });
    }

    // 4. Audit Log
    await auditRepository.log({
      actorId: params.userId,
      action: 'BOOKING_CREATED',
      resourceType: 'Booking',
      resourceId: booking.id,
      metadata: { workerId: params.workerId, rate: agreedRate },
    });

    return booking;
  }

  async getBookingById(bookingId: string, userId?: string, role?: UserRole) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Booking not found', 404);
    }

    // Ownership check for non-admin
    if (userId && role !== UserRole.ADMIN) {
      const isClient = booking.client.userId === userId;
      const isWorker = booking.worker.userId === userId;
      if (!isClient && !isWorker) {
        throw new AppError(ErrorCode.FORBIDDEN, 'Not authorized to view this booking', 403);
      }
    }

    return booking;
  }

  async getClientBookings(clientId: string) {
    return bookingRepository.findByClientId(clientId);
  }

  async getWorkerBookings(workerId: string) {
    return bookingRepository.findByWorkerId(workerId);
  }

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    userId?: string,
    role?: UserRole
  ) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Booking not found', 404);
    }

    const currentStatus = booking.status;

    // Validate Valid State Transitions
    const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.REQUESTED]: [BookingStatus.ACCEPTED, BookingStatus.REJECTED, BookingStatus.CANCELLED],
      [BookingStatus.ACCEPTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.WORKER_ON_WAY, BookingStatus.CANCELLED],
      [BookingStatus.WORKER_ON_WAY]: [BookingStatus.ARRIVED, BookingStatus.CANCELLED],
      [BookingStatus.ARRIVED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.REJECTED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.DISPUTED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        ErrorCode.INVALID_STATUS_TRANSITION,
        `Cannot transition booking status from '${currentStatus}' to '${newStatus}'`,
        400
      );
    }

    // Enforce Ownership Rules for specific actions
    if (userId && role !== UserRole.ADMIN) {
      const isClient = booking.client.userId === userId;
      const isWorker = booking.worker.userId === userId;

      if (newStatus === BookingStatus.ACCEPTED || newStatus === BookingStatus.REJECTED || newStatus === BookingStatus.WORKER_ON_WAY || newStatus === BookingStatus.ARRIVED) {
        if (!isWorker) {
          throw new AppError(ErrorCode.FORBIDDEN, 'Only the assigned worker can perform this transition', 403);
        }
      }

      if (newStatus === BookingStatus.CANCELLED) {
        if (!isClient && !isWorker) {
          throw new AppError(ErrorCode.FORBIDDEN, 'Only the client or worker can cancel this booking', 403);
        }
      }
    }

    const updated = await bookingRepository.updateStatus(bookingId, newStatus);

    // Notify Parties
    const notifyUserId = role === UserRole.WORKER ? booking.client.userId : booking.worker.userId;
    if (notifyUserId) {
      await notificationRepository.create({
        userId: notifyUserId,
        title: `Booking Update: ${newStatus}`,
        message: `Booking #${booking.id.slice(0, 8)} status changed to ${newStatus}`,
        type: `BOOKING_${newStatus}`,
        data: { bookingId: booking.id, newStatus },
      });
    }

    // Audit Log
    await auditRepository.log({
      actorId: userId,
      action: `BOOKING_STATUS_${newStatus}`,
      resourceType: 'Booking',
      resourceId: booking.id,
      metadata: { from: currentStatus, to: newStatus },
    });

    return updated;
  }
}

export const bookingService = new BookingService();
