import { workerRepository, WorkerSearchParams } from '../repositories/worker.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { VerificationStatus } from '@prisma/client';

export class WorkerService {
  async getWorkerById(id: string) {
    const worker = await workerRepository.findById(id);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, `Worker profile with id '${id}' not found`, 404);
    }
    return worker;
  }

  async getWorkerByUserId(userId: string) {
    const worker = await workerRepository.findByUserId(userId);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, `Worker profile for user '${userId}' not found`, 404);
    }
    return worker;
  }

  async searchWorkers(params: WorkerSearchParams) {
    return workerRepository.searchWorkers(params);
  }

  async updateProfile(
    workerId: string,
    data: {
      name?: string;
      nameEn?: string;
      trade?: string;
      bio?: string;
      dailyRate?: number;
      city?: string;
      isAvailable?: boolean;
    },
    userId?: string
  ) {
    const existing = await workerRepository.findById(workerId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker profile not found', 404);
    }

    if (userId && existing.userId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You can only update your own worker profile', 403);
    }

    return workerRepository.updateWorkerProfile(workerId, data);
  }

  async updateAvailability(workerId: string, isAvailable: boolean, userId?: string) {
    const existing = await workerRepository.findById(workerId);
    if (!existing) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker profile not found', 404);
    }

    if (userId && existing.userId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You can only update your own availability', 403);
    }

    return workerRepository.updateWorkerProfile(workerId, { isAvailable });
  }

  async getPendingWorkers() {
    return workerRepository.findPendingWorkers();
  }
}

export const workerService = new WorkerService();
