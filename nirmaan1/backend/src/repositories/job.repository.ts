import { prisma } from '../infrastructure/database.js';
import { JobStatus, ApplicationStatus, Prisma } from '@prisma/client';

export class JobRepository {
  async findById(id: string) {
    return prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        location: true,
        applications: {
          include: { worker: true },
        },
      },
    });
  }

  async searchJobs(params: {
    trade?: string;
    city?: string;
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.JobWhereInput = {};

    if (params.status) {
      where.status = params.status;
    } else {
      where.status = JobStatus.OPEN;
    }

    if (params.trade) {
      where.tradeRequired = { equals: params.trade, mode: 'insensitive' };
    }

    if (params.city) {
      where.location = { city: { equals: params.city, mode: 'insensitive' } };
    }

    const take = params.limit || 20;
    const skip = params.offset || 0;

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, city: true } },
          location: true,
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);

    return { jobs, total, limit: take, offset: skip };
  }

  async create(data: Prisma.JobCreateInput) {
    return prisma.job.create({
      data,
      include: { client: true, location: true },
    });
  }

  async updateStatus(id: string, status: JobStatus) {
    return prisma.job.update({
      where: { id },
      data: { status },
    });
  }

  async applyForJob(jobId: string, workerId: string, proposedRate?: number, coverNote?: string) {
    return prisma.jobApplication.create({
      data: {
        job: { connect: { id: jobId } },
        worker: { connect: { id: workerId } },
        proposedRate,
        coverNote,
      },
    });
  }

  async findApplication(jobId: string, workerId: string) {
    return prisma.jobApplication.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId,
        },
      },
    });
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: { job: true, worker: true },
    });
  }
}

export const jobRepository = new JobRepository();
