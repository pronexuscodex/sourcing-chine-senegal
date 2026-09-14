import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationChannel } from './notification-channel.interface';
import { LogChannel } from './log.channel';
import { WhatsAppChannel } from './whatsapp.channel';

@Injectable()
export class ChannelResolver {
  constructor(
    private readonly logChannel: LogChannel,
    private readonly whatsAppChannel: WhatsAppChannel,
    private readonly config: ConfigService,
  ) {}

  resolve(channel: string): NotificationChannel {
    if (channel === 'WHATSAPP' && this.config.get<string>('WHATSAPP_ACCESS_TOKEN')) {
      return this.whatsAppChannel;
    }
    // EMAIL/PUSH/SMS non encore implémentés, ou WhatsApp non configuré → secours dev-safe.
    return this.logChannel;
  }
}
