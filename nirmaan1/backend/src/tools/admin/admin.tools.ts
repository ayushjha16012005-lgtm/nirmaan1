import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { UserRole } from '../../auth/roles.js';
import { Permission } from '../../auth/permissions.js';
import { adminService } from '../../services/admin.service.js';
import { bookingService } from '../../services/booking.service.js';
import { BookingStatus, VerificationStatus } from '@prisma/client';

export const adminApproveWorkerTool: Tool = {
  name: 'approve_worker',
  description: 'Admin tool to approve a pending worker profile and make it public',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_APPROVE_WORKER],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
  }),
  async execute(input, context) {
    return adminService.approveWorker(input.workerId, context.userId || undefined);
  },
};

export const adminRejectWorkerTool: Tool = {
  name: 'reject_worker',
  description: 'Admin tool to reject a worker profile with optional reason',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_REJECT_WORKER],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  async execute(input, context) {
    return adminService.rejectWorker(input.workerId, input.reason, context.userId || undefined);
  },
};

export const adminSuspendWorkerTool: Tool = {
  name: 'suspend_worker',
  description: 'Admin tool to suspend a worker profile due to platform violations',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_SUSPEND_USER],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  async execute(input, context) {
    return adminService.rejectWorker(input.workerId, input.reason, context.userId || undefined);
  },
};

export const adminSuspendUserTool: Tool = {
  name: 'suspend_user',
  description: 'Admin tool to suspend a user account for policy violations',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_SUSPEND_USER],
  requireAuth: true,
  inputSchema: z.object({
    userId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  async execute(input, context) {
    return adminService.suspendUser(input.userId, input.reason, context.userId || undefined);
  },
};

export const adminVerifyDocumentTool: Tool = {
  name: 'verify_document',
  description: 'Admin verification of worker identity or skill certificate',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_VERIFY_DOCUMENT],
  requireAuth: true,
  inputSchema: z.object({
    documentId: z.string().uuid(),
    approved: z.boolean(),
    reason: z.string().optional(),
  }),
  async execute(input, context) {
    return adminService.verifyDocument(input.documentId, input.approved, input.reason, context.userId || undefined);
  },
};

export const adminResolveDisputeTool: Tool = {
  name: 'resolve_dispute',
  description: 'Admin arbitration to resolve a disputed booking or payment issue',
  riskLevel: RiskLevel.HIGH,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_VIEW_DASHBOARD],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
    resolution: z.enum(['COMPLETE', 'CANCEL']),
  }),
  async execute(input, context) {
    const targetStatus = input.resolution === 'COMPLETE' ? BookingStatus.COMPLETED : BookingStatus.CANCELLED;
    return bookingService.updateBookingStatus(input.bookingId, targetStatus, context.userId || undefined, UserRole.ADMIN);
  },
};

export const adminGetStatsTool: Tool = {
  name: 'admin_get_stats',
  description: 'Get aggregate platform statistics for admin dashboard',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [UserRole.ADMIN],
  permissions: [Permission.ADMIN_VIEW_DASHBOARD],
  requireAuth: true,
  inputSchema: z.object({}),
  async execute() {
    return adminService.getDashboardStats();
  },
};
