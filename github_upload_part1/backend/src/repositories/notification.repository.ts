import { prisma } from '../infrastructure/database.js';

export class NotificationRepository {
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    data?: Record<string, any>;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        data: data.data || {},
      },
    });
  }

  async findByUserId(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
