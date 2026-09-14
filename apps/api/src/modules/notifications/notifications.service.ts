import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  /**
   * Écrit l'intention en base immédiatement (statut PENDING) puis délègue l'envoi
   * réel à un worker BullMQ — jamais synchrone dans la requête HTTP (ARCHITECTURE.md §28).
   */
  async enqueue(userId: string, channel: string, eventType: string, payload: Record<string, unknown>) {
    const notification = await this.prisma.notification.create({
      data: { userId, channel, eventType, payload: payload as Prisma.InputJsonValue, status: 'PENDING' },
    });
    await this.queue.add('send', { notificationId: notification.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    return notification;
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  listAll(status?: string) {
    return this.prisma.notification.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
