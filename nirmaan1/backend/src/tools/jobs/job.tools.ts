import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { UserRole } from '../../auth/roles.js';
import { Permission } from '../../auth/permissions.js';
import { jobService } from '../../services/job.service.js';
import { AppError, ErrorCode } from '../../utils/errors.js';
import { ApplicationStatus } from '@prisma/client';

export const createJobTool: Tool = {
  name: 'create_job',
  description: 'Post a new construction, maintenance, or repair job requirement',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT],
  permissions: [Permission.CREATE_JOB],
  requireAuth: true,
  inputSchema: z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    tradeRequired: z.string(),
    budgetMin: z.number().optional(),
    budgetMax: z.number().optional(),
    scheduledDate: z.string(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
  async execute(input, context) {
    if (!context.clientProfileId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Client profile not associated with account', 401);
    }

    return jobService.createJob({
      clientId: context.clientProfileId,
      title: input.title,
      description: input.description,
      tradeRequired: input.tradeRequired,
      budgetMin: input.budgetMin,
      budgetMax: input.budgetMax,
      scheduledDate: input.scheduledDate,
      location: input.city && input.address
        ? {
            city: input.city,
            address: input.address,
            latitude: 28.5355,
            longitude: 77.391,
          }
        : undefined,
      userId: context.userId || undefined,
    });
  },
};

export const getJobTool: Tool = {
  name: 'get_job',
  description: 'Get job details and applications by Job ID',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    jobId: z.string().uuid(),
  }),
  async execute(input) {
    return jobService.getJobById(input.jobId);
  },
};

export const searchJobsTool: Tool = {
  name: 'search_jobs',
  description: 'Search open construction/repair jobs by trade or city',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    trade: z.string().optional(),
    city: z.string().optional(),
    limit: z.number().max(50).optional(),
    offset: z.number().optional(),
  }),
  async execute(input) {
    return jobService.searchJobs(input);
  },
};

export const applyJobTool: Tool = {
  name: 'apply_for_job',
  description: 'Submit an application for an open job posting',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.APPLY_JOB],
  requireAuth: true,
  inputSchema: z.object({
    jobId: z.string().uuid(),
    proposedRate: z.number().optional(),
    coverNote: z.string().optional(),
  }),
  async execute(input, context) {
    if (!context.workerProfileId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Worker profile required to apply for jobs', 401);
    }

    return jobService.applyForJob({
      jobId: input.jobId,
      workerId: context.workerProfileId,
      proposedRate: input.proposedRate,
      coverNote: input.coverNote,
      userId: context.userId || undefined,
    });
  },
};

export const getJobApplicationsTool: Tool = {
  name: 'get_job_applications',
  description: 'Retrieve all worker applications for a job posting',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [UserRole.CLIENT, UserRole.ADMIN],
  permissions: [Permission.MANAGE_APPLICATIONS],
  requireAuth: true,
  inputSchema: z.object({
    jobId: z.string().uuid(),
  }),
  async execute(input) {
    const job = await jobService.getJobById(input.jobId);
    return job.applications || [];
  },
};

export const acceptApplicationTool: Tool = {
  name: 'accept_application',
  description: 'Client accepts a worker application for a job',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT],
  permissions: [Permission.MANAGE_APPLICATIONS],
  requireAuth: true,
  inputSchema: z.object({
    applicationId: z.string().uuid(),
  }),
  async execute(input, context) {
    return jobService.updateApplicationStatus(input.applicationId, ApplicationStatus.ACCEPTED, context.clientProfileId);
  },
};

export const rejectApplicationTool: Tool = {
  name: 'reject_application',
  description: 'Client rejects a worker application for a job',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT],
  permissions: [Permission.MANAGE_APPLICATIONS],
  requireAuth: true,
  inputSchema: z.object({
    applicationId: z.string().uuid(),
  }),
  async execute(input, context) {
    return jobService.updateApplicationStatus(input.applicationId, ApplicationStatus.REJECTED, context.clientProfileId);
  },
};
