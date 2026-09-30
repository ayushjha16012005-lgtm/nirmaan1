import { prisma } from '../infrastructure/database.js';
import { workerRepository } from '../repositories/worker.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { VerificationStatus, UserStatus, BookingStatus } from '@prisma/client';

export class AdminService {
  async getDashboardStats() {
    const [
      totalWorkers,
      availableWorkers,
      pendingApprovals,
      activeBookings,
      totalUsers,
    ] = await Promise.all([
      prisma.workerProfile.count(),
      prisma.workerProfile.count({
        where: {
          isAvailable: true,
          verificationStatus: VerificationStatus.APPROVED,
        },
      }),
      prisma.workerProfile.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      prisma.booking.count({
        where: {
          status: {
            in: [
              BookingStatus.CONFIRMED,
              BookingStatus.WORKER_ON_WAY,
              BookingStatus.ARRIVED,
              BookingStatus.IN_PROGRESS,
            ],
          },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      totalWorkers,
      availableWorkers,
      pendingApprovals,
      activeBookings,
      totalUsers,
    };
  }

  async approveWorker(workerId: string, adminUserId?: string) {
    const worker = await workerRepository.findById(workerId);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker profile not found', 404);
    }

    const updated = await workerRepository.updateVerificationStatus(
      workerId,
      VerificationStatus.APPROVED
    );

    if (worker.userId) {
      await notificationRepository.create({
        userId: worker.userId,
        title: 'Profile Approved! 🎉',
        message: 'Congratulations! Your profile has been verified and is now live and searchable on Nirmaan.',
        type: 'WORKER_APPROVED',
        data: { workerId },
      });
    }

    await auditRepository.log({
      actorId: adminUserId,
      action: 'ADMIN_WORKER_APPROVED',
      resourceType: 'WorkerProfile',
      resourceId: workerId,
      metadata: { workerName: worker.name },
    });

    return updated;
  }

  async rejectWorker(workerId: string, reason?: string, adminUserId?: string) {
    const worker = await workerRepository.findById(workerId);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker profile not found', 404);
    }

    const updated = await workerRepository.updateVerificationStatus(
      workerId,
      VerificationStatus.REJECTED
    );

    if (worker.userId) {
      await notificationRepository.create({
        userId: worker.userId,
        title: 'Profile Verification Update',
        message: `Your profile verification could not be approved.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'WORKER_REJECTED',
        data: { workerId, reason },
      });
    }

    await auditRepository.log({
      actorId: adminUserId,
      action: 'ADMIN_WORKER_REJECTED',
      resourceType: 'WorkerProfile',
      resourceId: workerId,
      metadata: { reason },
    });

    return updated;
  }

  async suspendUser(userId: string, reason?: string, adminUserId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.SUSPENDED },
    });

    await auditRepository.log({
      actorId: adminUserId,
      action: 'ADMIN_USER_SUSPENDED',
      resourceType: 'User',
      resourceId: userId,
      metadata: { reason },
    });

    return updated;
  }

  async verifyDocument(documentId: string, approved: boolean, reason?: string, adminUserId?: string) {
    const doc = await prisma.workerDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Document not found', 404);
    }

    const status = approved ? VerificationStatus.APPROVED : VerificationStatus.REJECTED;

    const updated = await prisma.workerDocument.update({
      where: { id: documentId },
      data: {
        verificationStatus: status,
        verifiedAt: new Date(),
        verifiedBy: adminUserId,
        rejectionReason: approved ? null : reason,
      },
    });

    await auditRepository.log({
      actorId: adminUserId,
      action: `ADMIN_DOCUMENT_${status}`,
      resourceType: 'WorkerDocument',
      resourceId: documentId,
      metadata: { approved, reason },
    });

    return updated;
  }

  async getAuditLogs(limit = 50) {
    return auditRepository.findRecent(limit);
  }
}

export const adminService = new AdminService();
