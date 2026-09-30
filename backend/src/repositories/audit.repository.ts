import { prisma } from '../infrastructure/database.js';

export interface CreateAuditLogParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, any>;
  ipAddress?: string;
  requestId?: string;
}

export class AuditRepository {
  async log(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId || null,
          metadata: params.metadata || {},
          ipAddress: params.ipAddress || null,
          requestId: params.requestId || null,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  async findRecent(limit = 50) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { phone: true, role: true } },
      },
    });
  }
}

export const auditRepository = new AuditRepository();
