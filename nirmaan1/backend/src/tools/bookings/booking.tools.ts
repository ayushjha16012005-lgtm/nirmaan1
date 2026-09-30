import { z } from 'zod';
import { Tool, RiskLevel } from '../types.js';
import { UserRole } from '../../auth/roles.js';
import { Permission } from '../../auth/permissions.js';
import { bookingService } from '../../services/booking.service.js';
import { BookingStatus } from '@prisma/client';
import { AppError, ErrorCode } from '../../utils/errors.js';

export const createBookingTool: Tool = {
  name: 'create_booking',
  description: 'Book a verified worker for a specified date and rate',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT],
  permissions: [Permission.CREATE_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    workerId: z.string().uuid(),
    scheduledDate: z.string(),
    scheduledTime: z.string().optional(),
    agreedRate: z.number().optional(),
    notes: z.string().optional(),
    jobId: z.string().uuid().optional(),
  }),
  async execute(input, context) {
    if (!context.clientProfileId && !context.userId) {
      throw new AppError(ErrorCode.AUTH_REQUIRED, 'Client profile not identified in session', 401);
    }

    return bookingService.createBooking({
      clientId: context.clientProfileId || context.userId!,
      workerId: input.workerId,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      agreedRate: input.agreedRate,
      notes: input.notes,
      jobId: input.jobId,
      userId: context.userId || undefined,
    });
  },
};

export const getBookingTool: Tool = {
  name: 'get_booking',
  description: 'Retrieve booking details by booking ID with access check',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [UserRole.CLIENT, UserRole.WORKER, UserRole.ADMIN],
  permissions: [Permission.VIEW_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.getBookingById(input.bookingId, context.userId || undefined, context.role || undefined);
  },
};

export const getMyBookingsTool: Tool = {
  name: 'get_my_bookings',
  description: 'List all bookings associated with the current client or worker',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [UserRole.CLIENT, UserRole.WORKER],
  permissions: [Permission.VIEW_BOOKING],
  requireAuth: true,
  inputSchema: z.object({}),
  async execute(input, context) {
    if (context.role === UserRole.WORKER && context.workerProfileId) {
      return bookingService.getWorkerBookings(context.workerProfileId);
    }
    if (context.clientProfileId) {
      return bookingService.getClientBookings(context.clientProfileId);
    }
    return [];
  },
};

export const acceptBookingTool: Tool = {
  name: 'accept_booking',
  description: 'Worker tool to accept an incoming booking request',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.ACCEPT_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.ACCEPTED,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const rejectBookingTool: Tool = {
  name: 'reject_booking',
  description: 'Worker tool to reject an incoming booking request',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.REJECT_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.REJECTED,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const cancelBookingTool: Tool = {
  name: 'cancel_booking',
  description: 'Cancel a booking before completion',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT, UserRole.WORKER, UserRole.ADMIN],
  permissions: [Permission.CANCEL_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.CANCELLED,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const startBookingTool: Tool = {
  name: 'start_booking',
  description: 'Worker mark on the way / in progress',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.START_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.IN_PROGRESS,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const markArrivedTool: Tool = {
  name: 'mark_arrived',
  description: 'Worker marks arrival at client location',
  riskLevel: RiskLevel.LOW,
  allowedRoles: [UserRole.WORKER],
  permissions: [Permission.MARK_ARRIVED],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.ARRIVED,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const completeBookingTool: Tool = {
  name: 'complete_booking',
  description: 'Mark booking as successfully completed',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.WORKER, UserRole.ADMIN],
  permissions: [Permission.COMPLETE_BOOKING],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      BookingStatus.COMPLETED,
      context.userId || undefined,
      context.role || undefined
    );
  },
};

export const updateBookingStatusTool: Tool = {
  name: 'update_booking_status',
  description: 'Transition booking lifecycle status',
  riskLevel: RiskLevel.MEDIUM,
  allowedRoles: [UserRole.CLIENT, UserRole.WORKER, UserRole.ADMIN],
  permissions: [],
  requireAuth: true,
  inputSchema: z.object({
    bookingId: z.string().uuid(),
    status: z.nativeEnum(BookingStatus),
  }),
  async execute(input, context) {
    return bookingService.updateBookingStatus(
      input.bookingId,
      input.status,
      context.userId || undefined,
      context.role || undefined
    );
  },
};
