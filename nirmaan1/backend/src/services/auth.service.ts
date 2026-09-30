import { prisma } from '../infrastructure/database.js';
import { generateToken, AuthTokenPayload } from '../auth/jwt.js';
import { UserRole, UserStatus, VerificationStatus } from '@prisma/client';
import { AppError, ErrorCode } from '../utils/errors.js';
import { auditRepository } from '../repositories/audit.repository.js';

export class AuthService {
  /**
   * Phone / OTP Verification & Authentication
   * Supports both Worker and Client registration/login
   */
  async loginOrRegisterWithPhone(params: {
    phone: string;
    otp: string;
    role?: UserRole;
    name?: string;
    nameEn?: string;
    trade?: string;
    city?: string;
    experienceYears?: number;
    dailyRate?: number;
    isAvailable?: boolean;
    ipAddress?: string;
    requestId?: string;
  }) {
    // In production, verify OTP via SMS provider / Supabase Auth.
    // For development, validate 4+ digit numeric code.
    if (!/^\d{4,6}$/.test(params.otp)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid OTP format. Must be 4-6 digits.', 400);
    }

    const cleanPhone = params.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phone number. Must be at least 10 digits.', 400);
    }

    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
      include: { workerProfile: true, clientProfile: true },
    });

    if (!user) {
      // Create new user
      const assignedRole = params.role || (params.trade ? UserRole.WORKER : UserRole.CLIENT);

      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          role: assignedRole,
          status: UserStatus.ACTIVE,
          ...(assignedRole === UserRole.WORKER && params.trade
            ? {
                workerProfile: {
                  create: {
                    name: params.name || 'New Worker',
                    nameEn: params.nameEn || params.name || 'New Worker',
                    trade: params.trade,
                    city: params.city || 'Delhi',
                    experienceYears: params.experienceYears || 0,
                    dailyRate: params.dailyRate || 500,
                    isAvailable: params.isAvailable !== undefined ? params.isAvailable : true,
                    verificationStatus: VerificationStatus.PENDING,
                  },
                },
              }
            : {}),
          ...(assignedRole === UserRole.CLIENT
            ? {
                clientProfile: {
                  create: {
                    name: params.name || 'Valued Client',
                    phone: cleanPhone,
                    city: params.city || 'Delhi',
                  },
                },
              }
            : {}),
        },
        include: { workerProfile: true, clientProfile: true },
      });

      await auditRepository.log({
        actorId: user.id,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user.id,
        ipAddress: params.ipAddress,
        requestId: params.requestId,
      });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(ErrorCode.FORBIDDEN, 'Your account has been suspended. Please contact support.', 403);
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      role: user.role as any,
      phone: user.phone,
      workerProfileId: user.workerProfile?.id,
      clientProfileId: user.clientProfile?.id,
    };

    const token = generateToken(payload);

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        workerProfile: user.workerProfile,
        clientProfile: user.clientProfile,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true, clientProfile: true },
    });

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    return user;
  }
}

export const authService = new AuthService();
