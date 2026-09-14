import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelResolver } from './channels/channel-resolver.service';

interface SendNotificationJobData {
  notificationId: string;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: ChannelResolver,
  ) {
    super();
  }

  async process(job: Job<SendNotificationJobData>): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: job.data.notificationId },
      // Jamais `user: true` (fuiterait passwordHash/mfaSecret) même en usage interne
      // uniquement — ne demander que les champs dont un canal a réellement besoin.
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!notification) {
      this.logger.warn(`Notification ${job.data.notificationId} introuvable — job ignoré.`);
      return;
    }

    const channel = this.resolver.resolve(notification.channel);

    try {
      await channel.send(
        {
          id: notification.id,
          userId: notification.userId,
          eventType: notification.eventType,
          payload: notification.payload as Record<string, unknown>,
        },
        { email: notification.user.email, phone: notification.user.phone },
      );
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      await this.prisma.notification.update({ where: { id: notification.id }, data: { status: 'FAILED' } });
      throw error; // laisse BullMQ appliquer la politique de retry de la queue
    }
  }
}
