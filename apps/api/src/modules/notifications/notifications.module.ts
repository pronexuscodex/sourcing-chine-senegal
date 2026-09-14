import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AdminNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsListener } from './notifications.listener';
import { ChannelResolver } from './channels/channel-resolver.service';
import { LogChannel } from './channels/log.channel';
import { WhatsAppChannel } from './channels/whatsapp.channel';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  controllers: [NotificationsController, AdminNotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    NotificationsListener,
    ChannelResolver,
    LogChannel,
    WhatsAppChannel,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
