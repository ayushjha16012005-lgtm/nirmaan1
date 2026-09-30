import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { UserRole } from '../../auth/roles.js';
import { Permission } from '../../auth/permissions.js';
import { workerService } from '../../services/worker.service.js';
import { bookingRepository } from '../../repositories/booking.repository.js';

export const searchWorkersTool: Tool = {
  name: 'search_workers',
  description: 'Search and filter verified, approved workers by trade, city, rate, and rating',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    trade: z.string().optional(),
    city: z.string().optional(),
    maxDailyRate: z.number().optional(),
    minRating: z.number().optional(),
    availableOnly: z.boolean().optional(),
    searchQuery: z.string().optional(),
    limit: z.number().max(50).optional(),
    offset: z.number().optional(),
  }),
  async execute(input) {
    return workerService.searchWorkers(input);
  },
};

export const getWorkerTool: Tool = {
  name: 'get_worker',
  description: 'Get detailed public profile of a verified worker',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    workerId: z.string().uuid(),
  }),
  async execute(input) {
    return workerService.getWorkerById(input.workerId);
  },
};

export const checkWorkerAvailabilityTool: Tool = {
  name: 'check_worker_availability',
  description: 'Check if a worker is available and has no scheduling conflicts on a target date',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [],
  permissions: [],
  requireAuth: false,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    date: z.string(),
  }),
  async execute(input) {
    const worker = await workerService.getWorkerById(input.workerId);
    const conflicts = await bookingRepository.findActiveBookingsOnDate(
      input.workerId,
      new Date(input.date)
    );
    const hasConflict = conflicts.length > 0;
    return {
      workerId: input.workerId,
      date: input.date,
      isGeneralAvailable: worker.isAvailable,
      hasConflict,
      canBook: worker.isAvailable && !hasConflict && worker.verificationStatus === 'APPROVED',
    };
  },
};

export const updateWorkerProfileTool: Tool = {
  name: 'update_worker_profile',
  description: 'Update the authenticated worker profile details',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.UPDATE_WORKER_PROFILE],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    name: z.string().min(2).optional(),
    trade: z.string().optional(),
    bio: z.string().optional(),
    dailyRate: z.number().min(100).optional(),
    city: z.string().optional(),
    isAvailable: z.boolean().optional(),
  }),
  async execute(input, context) {
    return workerService.updateProfile(input.workerId, input, context.userId || undefined);
  },
};

export const updateWorkerAvailabilityTool: Tool = {
  name: 'update_worker_availability',
  description: 'Toggle worker availability status (available / busy)',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.UPDATE_WORKER_AVAILABILITY],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    isAvailable: z.boolean(),
  }),
  async execute(input, context) {
    return workerService.updateAvailability(input.workerId, input.isAvailable, context.userId || undefined);
  },
};
