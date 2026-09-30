import { describe, it, expect, vi } from 'vitest';
import { BookingStatus, VerificationStatus, UserRole } from '@prisma/client';
import { BookingService } from '../src/services/booking.service.js';
import { workerRepository } from '../src/repositories/worker.repository.js';
import { bookingRepository } from '../src/repositories/booking.repository.js';
import { notificationRepository } from '../src/repositories/notification.repository.js';
import { auditRepository } from '../src/repositories/audit.repository.js';
import { AppError, ErrorCode } from '../src/utils/errors.js';

describe('Booking State Machine & Concurrency Conflict Audit', () => {
  const service = new BookingService();

  const mockApprovedWorker = {
    id: 'worker-valid-1',
    userId: 'user-worker-1',
    name: 'Ramesh Kumar',
    trade: 'Mason',
    dailyRate: 700,
    isAvailable: true,
    verificationStatus: VerificationStatus.APPROVED,
  };

  it('should reject booking if worker is unapproved or pending', async () => {
    vi.spyOn(workerRepository, 'findById').mockResolvedValueOnce({
      ...mockApprovedWorker,
      verificationStatus: VerificationStatus.PENDING,
    } as any);

    await expect(
      service.createBooking({
        clientId: 'client-1',
        workerId: 'worker-valid-1',
        scheduledDate: '2026-10-15',
      })
    ).rejects.toThrowError(/not approved/);
  });

  it('should reject booking if worker is marked unavailable', async () => {
    vi.spyOn(workerRepository, 'findById').mockResolvedValueOnce({
      ...mockApprovedWorker,
      isAvailable: false,
    } as any);

    await expect(
      service.createBooking({
        clientId: 'client-1',
        workerId: 'worker-valid-1',
        scheduledDate: '2026-10-15',
      })
    ).rejects.toThrowError(/unavailable/);
  });

  it('CONCURRENCY CONFLICT: should reject double booking on the same worker and date', async () => {
    vi.spyOn(workerRepository, 'findById').mockResolvedValue(mockApprovedWorker as any);
    vi.spyOn(bookingRepository, 'createAtomicWithConflictCheck').mockRejectedValueOnce(
      new AppError(
        ErrorCode.BOOKING_CONFLICT,
        'Worker already has a scheduled or active booking on this date',
        409
      )
    );

    await expect(
      service.createBooking({
        clientId: 'client-2',
        workerId: 'worker-valid-1',
        scheduledDate: '2026-10-15',
      })
    ).rejects.toThrowError(/already has a scheduled or active booking/);
  });

  it('STATE TRANSITIONS: should reject illegal transition from COMPLETED to ACCEPTED', async () => {
    vi.spyOn(bookingRepository, 'findById').mockResolvedValueOnce({
      id: 'booking-1',
      status: BookingStatus.COMPLETED,
      client: { userId: 'client-user-1' },
      worker: { userId: 'worker-user-1' },
    } as any);

    await expect(
      service.updateBookingStatus('booking-1', BookingStatus.ACCEPTED, 'worker-user-1', UserRole.WORKER)
    ).rejects.toThrowError(/Cannot transition/);
  });

  it('STATE TRANSITIONS: should reject illegal transition from REJECTED to IN_PROGRESS', async () => {
    vi.spyOn(bookingRepository, 'findById').mockResolvedValueOnce({
      id: 'booking-2',
      status: BookingStatus.REJECTED,
      client: { userId: 'client-user-1' },
      worker: { userId: 'worker-user-1' },
    } as any);

    await expect(
      service.updateBookingStatus('booking-2', BookingStatus.IN_PROGRESS, 'worker-user-1', UserRole.WORKER)
    ).rejects.toThrowError(/Cannot transition/);
  });

  it('OWNERSHIP: client cannot mark a booking as ARRIVED on behalf of worker', async () => {
    vi.spyOn(bookingRepository, 'findById').mockResolvedValueOnce({
      id: 'booking-3',
      status: BookingStatus.WORKER_ON_WAY,
      client: { userId: 'client-user-1' },
      worker: { userId: 'worker-user-1' },
    } as any);

    await expect(
      service.updateBookingStatus('booking-3', BookingStatus.ARRIVED, 'client-user-1', UserRole.CLIENT)
    ).rejects.toThrowError(/Only the assigned worker/);
  });
});
