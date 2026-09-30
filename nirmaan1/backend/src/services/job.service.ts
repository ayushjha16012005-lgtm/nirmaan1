import { jobRepository } from '../repositories/job.repository.js';
import { workerRepository } from '../repositories/worker.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError, ErrorCode } from '../utils/errors.js';
import { JobStatus, ApplicationStatus, VerificationStatus } from '@prisma/client';

export class JobService {
  async createJob(params: {
    clientId: string;
    title: string;
    description: string;
    tradeRequired: string;
    budgetMin?: number;
    budgetMax?: number;
    scheduledDate: string | Date;
    location?: {
      address: string;
      city: string;
      latitude: number;
      longitude: number;
    };
    userId?: string;
  }) {
    const job = await jobRepository.create({
      client: { connect: { id: params.clientId } },
      title: params.title,
      description: params.description,
      tradeRequired: params.tradeRequired,
      budgetMin: params.budgetMin,
      budgetMax: params.budgetMax,
      scheduledDate: new Date(params.scheduledDate),
      status: JobStatus.OPEN,
      ...(params.location
        ? {
            location: {
              create: {
                address: params.location.address,
                city: params.location.city,
                latitude: params.location.latitude,
                longitude: params.location.longitude,
              },
            },
          }
        : {}),
    });

    await auditRepository.log({
      actorId: params.userId,
      action: 'JOB_CREATED',
      resourceType: 'Job',
      resourceId: job.id,
      metadata: { trade: params.tradeRequired },
    });

    return job;
  }

  async getJobById(id: string) {
    const job = await jobRepository.findById(id);
    if (!job) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Job not found', 404);
    }
    return job;
  }

  async searchJobs(params: {
    trade?: string;
    city?: string;
    status?: JobStatus;
    limit?: number;
    offset?: number;
  }) {
    return jobRepository.searchJobs(params);
  }

  async applyForJob(params: {
    jobId: string;
    workerId: string;
    proposedRate?: number;
    coverNote?: string;
    userId?: string;
  }) {
    const job = await jobRepository.findById(params.jobId);
    if (!job) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Job not found', 404);
    }

    if (job.status !== JobStatus.OPEN) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Cannot apply to a job that is not OPEN', 400);
    }

    const worker = await workerRepository.findById(params.workerId);
    if (!worker) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Worker profile not found', 404);
    }

    if (worker.verificationStatus !== VerificationStatus.APPROVED) {
      throw new AppError(
        ErrorCode.WORKER_NOT_APPROVED,
        'Worker profile must be approved to apply for jobs',
        400
      );
    }

    const existingApp = await jobRepository.findApplication(params.jobId, params.workerId);
    if (existingApp) {
      throw new AppError(
        ErrorCode.DUPLICATE_APPLICATION,
        'You have already applied for this job',
        409
      );
    }

    const application = await jobRepository.applyForJob(
      params.jobId,
      params.workerId,
      params.proposedRate,
      params.coverNote
    );

    // Notify client
    if (job.client?.userId) {
      await notificationRepository.create({
        userId: job.client.userId,
        title: 'New Job Application',
        message: `${worker.name} applied for your job: "${job.title}"`,
        type: 'JOB_APPLICATION_RECEIVED',
        data: { jobId: job.id, applicationId: application.id },
      });
    }

    return application;
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    clientId?: string
  ) {
    const updated = await jobRepository.updateApplicationStatus(applicationId, status);
    if (updated.worker.userId) {
      await notificationRepository.create({
        userId: updated.worker.userId,
        title: `Application ${status}`,
        message: `Your application for job "${updated.job.title}" was ${status}.`,
        type: `APPLICATION_${status}`,
        data: { jobId: updated.job.id, applicationId },
      });
    }
    return updated;
  }
}

export const jobService = new JobService();
