import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NotificationChannel, NotificationRecipient, NotificationToSend } from './notification-channel.interface';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/**
 * NON VÉRIFIÉ EN CONDITIONS RÉELLES — implémenté d'après la documentation publique
 * de l'API Cloud WhatsApp de Meta (aucun numéro de test / token disponible pendant
 * le développement). À valider avant mise en production (ARCHITECTURE.md §20).
 */
@Injectable()
export class WhatsAppChannel implements NotificationChannel {
  readonly name = 'WHATSAPP';
  private readonly logger = new Logger(WhatsAppChannel.name);

  constructor(private readonly config: ConfigService) {}

  async send(notification: NotificationToSend, recipient: NotificationRecipient): Promise<void> {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (!phoneNumberId || !accessToken || !recipient.phone) {
      throw new Error('Configuration WhatsApp ou téléphone du destinataire manquant.');
    }

    const response = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient.phone,
        type: 'text',
        text: { body: this.renderMessage(notification) },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Échec envoi WhatsApp: ${response.status} ${body}`);
      throw new Error('Échec envoi WhatsApp.');
    }
  }

  private renderMessage(notification: NotificationToSend): string {
    return typeof notification.payload.message === 'string'
      ? notification.payload.message
      : `Mise à jour : ${notification.eventType}`;
  }
}
