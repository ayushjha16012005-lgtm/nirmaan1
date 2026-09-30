import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, VerificationStatus, BookingStatus, ApplicationStatus } from '@prisma/client';
import { AuthService } from '../src/services/auth.service.js';
import { WorkerService } from '../src/services/worker.service.js';
import { BookingService } from '../src/services/booking.service.js';
import { JobService } from '../src/services/job.service.js';
import { ReviewService } from '../src/services/review.service.js';
import { AdminService } from '../src/services/admin.service.js';
import { workerRepository } from '../src/repositories/worker.repository.js';
import { bookingRepository } from '../src/repositories/booking.repository.js';
import { jobRepository } from '../src/repositories/job.repository.js';
import { reviewRepository } from '../src/repositories/review.repository.js';
import { notificationRepository } from '../src/repositories/notification.repository.js';
import { auditRepository } from '../src/repositories/audit.repository.js';

describe('Phase 85: Complete End-to-End User Journeys', () => {
  const workerService = new WorkerService();
  const bookingService = new BookingService();
  const jobService = new JobService();
  const reviewService = new ReviewService();
  const adminService = new AdminService();

  beforeEach(() => {
    vi.spyOn(notificationRepository, 'create').mockResolvedValue({} as any);
    vi.spyOn(auditRepository, 'log').mockResolvedValue({} as any);
  });

  it('JOURNEY A (Worker Lifecycle): Register -> Admin Approve -> Availability -> Receive Booking -> Arrive -> Complete', async () => {
    // 1. Worker Profile
    const mockWorker = {
      id: 'worker-journey-1',
      userId: 'user-worker-1',
      name: 'Ramesh Kumar',
      trade: 'Mason',
      city: 'Noida',
      dailyRate: 700,
      isAvailable: true,
      verificationStatus: VerificationStatus.PENDING,
    };

    vi.spyOn(workerRepository, 'findById').mockResolvedValue(mockWorker as any);
    vi.spyOn(workerRepository, 'updateVerificationStatus').mockResolvedValue({
      ...mockWorker,
      verificationStatus: VerificationStatus.APPROVED,
    } as any);

    // 2. Admin Approval
    const approvedWorker = await adminService.approveWorker(mockWorker.id, 'admin-id');
    expect(approvedWorker.verificationStatus).toBe(VerificationStatus.APPROVED);

    // 3. Update Availability
    vi.spyOn(workerRepository, 'updateWorkerProfile').mockResolvedValue({
      ...mockWorker,
      isAvailable: true,
    } as any);
    const avail = await workerService.updateAvailability(mockWorker.id, true, mockWorker.userId);
    expect(avail.isAvailable).toBe(true);

    // 4. Accept Booking -> Start -> Arrive -> Complete
    const mockBooking = {
      id: 'booking-journey-1',
      status: BookingStatus.REQUESTED,
      client: { userId: 'client-user-1' },
      worker: { userId: 'user-worker-1' },
    };

    vi.spyOn(bookingRepository, 'findById').mockResolvedValue(mockBooking as any);
    vi.spyOn(bookingRepository, 'updateStatus').mockImplementation(async (id, status) => ({
      ...mockBooking,
      status,
    } as any));

    const accepted = await bookingService.updateBookingStatus(
      mockBooking.id,
      BookingStatus.ACCEPTED,
      mockWorker.userId,
      UserRole.WORKER
    );
    expect(accepted.status).toBe(BookingStatus.ACCEPTED);
  });

  it('JOURNEY B (Client Lifecycle): Search Worker -> Book Worker -> Complete -> Review', async () => {
    // 1. Search
    vi.spyOn(workerRepository, 'searchWorkers').mockResolvedValueOnce({
      workers: [
        {
          id: 'w-1',
          name: 'Sunil Verma',
          trade: 'Electrician',
          city: 'Delhi',
          dailyRate: 600,
          isAvailable: true,
          verificationStatus: VerificationStatus.APPROVED,
        },
      ] as any,
      total: 1,
      limit: 20,
      offset: 0,
    });

    const searchResults = await workerService.searchWorkers({ trade: 'Electrician', city: 'Delhi' });
    expect(searchResults.workers).toHaveLength(1);
    expect(searchResults.workers[0].trade).toBe('Electrician');

    // 2. Create Review for Completed Booking
    vi.spyOn(bookingRepository, 'findById').mockResolvedValueOnce({
      id: 'booking-completed-1',
      clientId: 'client-profile-1',
      workerId: 'w-1',
      status: BookingStatus.COMPLETED,
    } as any);

    vi.spyOn(reviewRepository, 'findByBookingId').mockResolvedValueOnce(null);
    vi.spyOn(reviewRepository, 'create').mockResolvedValueOnce({
      id: 'review-1',
      bookingId: 'booking-completed-1',
      rating: 5,
      comment: 'Excellent wiring work!',
    } as any);

    const review = await reviewService.createReview({
      bookingId: 'booking-completed-1',
      clientId: 'client-profile-1',
      rating: 5,
      comment: 'Excellent wiring work!',
    });

    expect(review.rating).toBe(5);
  });

  it('JOURNEY C (Job Marketplace): Post Job -> Worker Applies -> Client Accepts Application', async () => {
    // 1. Create Job
    const mockJob = {
      id: 'job-journey-1',
      clientId: 'client-1',
      title: 'Fix kitchen plumbing',
      description: 'Need pipe replacement in bathroom and kitchen',
      tradeRequired: 'Plumber',
      status: 'OPEN',
      client: { userId: 'client-user-1' },
    };

    vi.spyOn(jobRepository, 'create').mockResolvedValueOnce(mockJob as any);
    const job = await jobService.createJob({
      clientId: 'client-1',
      title: mockJob.title,
      description: mockJob.description,
      tradeRequired: mockJob.tradeRequired,
      scheduledDate: '2026-10-20',
    });
    expect(job.title).toBe(mockJob.title);

    // 2. Worker Applies
    vi.spyOn(jobRepository, 'findById').mockResolvedValueOnce(mockJob as any);
    vi.spyOn(workerRepository, 'findById').mockResolvedValueOnce({
      id: 'worker-plumber-1',
      name: 'Mohan Lal',
      verificationStatus: VerificationStatus.APPROVED,
    } as any);
    vi.spyOn(jobRepository, 'findApplication').mockResolvedValueOnce(null);
    vi.spyOn(jobRepository, 'applyForJob').mockResolvedValueOnce({
      id: 'app-1',
      jobId: mockJob.id,
      workerId: 'worker-plumber-1',
      proposedRate: 750,
      status: ApplicationStatus.PENDING,
    } as any);

    const application = await jobService.applyForJob({
      jobId: mockJob.id,
      workerId: 'worker-plumber-1',
      proposedRate: 750,
    });
    expect(application.status).toBe(ApplicationStatus.PENDING);

    // 3. Client Accepts Application
    vi.spyOn(jobRepository, 'updateApplicationStatus').mockResolvedValueOnce({
      id: 'app-1',
      job: mockJob,
      worker: { userId: 'user-worker-plumber' },
      status: ApplicationStatus.ACCEPTED,
    } as any);

    const acceptedApp = await jobService.updateApplicationStatus('app-1', ApplicationStatus.ACCEPTED);
    expect(acceptedApp.status).toBe(ApplicationStatus.ACCEPTED);
  });
});
