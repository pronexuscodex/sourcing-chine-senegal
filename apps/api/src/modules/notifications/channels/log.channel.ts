import { Injectable, Logger } from '@nestjs/common';
import type { NotificationChannel, NotificationRecipient, NotificationToSend } from './notification-channel.interface';

/**
 * Canal de secours dev-safe : n'envoie rien réellement, journalise l'intention.
 * Utilisé pour EMAIL/PUSH/SMS (non encore implémentés) et pour WHATSAPP quand
 * aucune configuration Meta Cloud API n'est présente — jamais silencieux, jamais bloquant.
 */
@Injectable()
export class LogChannel implements NotificationChannel {
  readonly name = 'LOG';
  private readonly logger = new Logger(LogChannel.name);

  async send(notification: NotificationToSend, recipient: NotificationRecipient): Promise<void> {
    this.logger.log(
      `[notification] to=${recipient.email ?? recipient.phone ?? notification.userId} ` +
        `event=${notification.eventType} payload=${JSON.stringify(notification.payload)}`,
    );
  }
}
