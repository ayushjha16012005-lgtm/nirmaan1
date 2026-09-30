import { prisma } from '../infrastructure/database.js';
import { VerificationStatus, Prisma } from '@prisma/client';

export interface WorkerSearchParams {
  trade?: string;
  city?: string;
  maxDailyRate?: number;
  minRating?: number;
  availableOnly?: boolean;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export class WorkerRepository {
  async findById(id: string) {
    return prisma.workerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { phone: true, email: true, status: true } },
        availabilities: true,
        documents: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { client: { select: { name: true, city: true } } },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        availabilities: true,
        documents: true,
      },
    });
  }

  async searchWorkers(params: WorkerSearchParams) {
    const where: Prisma.WorkerProfileWhereInput = {
      verificationStatus: VerificationStatus.APPROVED,
      user: { status: 'ACTIVE' },
    };

    if (params.trade) {
      where.trade = { equals: params.trade, mode: 'insensitive' };
    }

    if (params.city) {
      where.city = { equals: params.city, mode: 'insensitive' };
    }

    if (params.maxDailyRate) {
      where.dailyRate = { lte: params.maxDailyRate };
    }

    if (params.minRating) {
      where.rating = { gte: params.minRating };
    }

    if (params.availableOnly) {
      where.isAvailable = true;
    }

    if (params.searchQuery) {
      where.OR = [
        { name: { contains: params.searchQuery, mode: 'insensitive' } },
        { nameEn: { contains: params.searchQuery, mode: 'insensitive' } },
        { trade: { contains: params.searchQuery, mode: 'insensitive' } },
        { city: { contains: params.searchQuery, mode: 'insensitive' } },
      ];
    }

    const take = params.limit || 20;
    const skip = params.offset || 0;

    const [workers, total] = await Promise.all([
      prisma.workerProfile.findMany({
        where,
        take,
        skip,
        orderBy: [{ isAvailable: 'desc' }, { rating: 'desc' }, { totalJobs: 'desc' }],
        include: {
          reviews: { take: 3, orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.workerProfile.count({ where }),
    ]);

    return { workers, total, limit: take, offset: skip };
  }

  async findPendingWorkers() {
    return prisma.workerProfile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { phone: true, email: true, createdAt: true } },
        documents: true,
      },
    });
  }

  async createWorkerProfile(data: Prisma.WorkerProfileCreateInput) {
    return prisma.workerProfile.create({ data });
  }

  async updateWorkerProfile(id: string, data: Prisma.WorkerProfileUpdateInput) {
    return prisma.workerProfile.update({
      where: { id },
      data,
    });
  }

  async updateVerificationStatus(id: string, status: VerificationStatus) {
    return prisma.workerProfile.update({
      where: { id },
      data: { verificationStatus: status },
    });
  }
}

export const workerRepository = new WorkerRepository();
