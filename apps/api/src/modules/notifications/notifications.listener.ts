import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface OrderStatusChangedEvent {
  orderId: string;
  customerId: string;
  status: string;
}

interface QuoteSentEvent {
  quoteId: string;
  customerId: string;
}

interface PaymentConfirmedEvent {
  orderId: string;
  customerId: string;
}

interface SupportReplyReceivedEvent {
  ticketId: string;
  userId: string;
}

// Événements client (ARCHITECTURE.md §20) — tous les statuts de commande ne méritent
// pas une notification, seulement ceux qui font avancer concrètement l'expérience client.
const ORDER_STATUS_MESSAGES: Partial<Record<string, string>> = {
  PAYMENT_PENDING: 'Votre commande a été créée. Merci de procéder au paiement.',
  AT_CHINA_WAREHOUSE: 'Votre produit est arrivé à notre entrepôt en Chine.',
  QUALITY_CHECK: 'Le contrôle qualité de votre commande est disponible.',
  SHIPPED: "Votre commande a été expédiée.",
  ARRIVED_SENEGAL: 'Votre commande est arrivée au Sénégal.',
  OUT_FOR_DELIVERY: 'Votre commande est en cours de livraison.',
  DELIVERED: 'Votre commande a été livrée.',
};

@Injectable()
export class NotificationsListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @OnEvent('order.status.changed')
  async handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    const message = ORDER_STATUS_MESSAGES[event.status];
    if (!message) return;

    const userId = await this.resolveUserId(event.customerId);
    if (!userId) return;

    await this.notifications.enqueue(userId, 'WHATSAPP', 'order.status.changed', {
      message,
      orderId: event.orderId,
      status: event.status,
    });
  }

  @OnEvent('quote.sent')
  async handleQuoteSent(event: QuoteSentEvent): Promise<void> {
    const userId = await this.resolveUserId(event.customerId);
    if (!userId) return;

    await this.notifications.enqueue(userId, 'WHATSAPP', 'quote.sent', {
      message: 'Votre devis est disponible.',
      quoteId: event.quoteId,
    });
  }

  @OnEvent('payment.confirmed')
  async handlePaymentConfirmed(event: PaymentConfirmedEvent): Promise<void> {
    const userId = await this.resolveUserId(event.customerId);
    if (!userId) return;

    await this.notifications.enqueue(userId, 'WHATSAPP', 'payment.confirmed', {
      message: 'Votre paiement a été confirmé.',
      orderId: event.orderId,
    });
  }

  @OnEvent('support.reply.received')
  async handleSupportReplyReceived(event: SupportReplyReceivedEvent): Promise<void> {
    // SupportTicket.userId référence User directement (pas de détour par CustomerProfile).
    await this.notifications.enqueue(event.userId, 'WHATSAPP', 'support.reply.received', {
      message: 'Le support a répondu à votre ticket.',
      ticketId: event.ticketId,
    });
  }

  private async resolveUserId(customerId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({ where: { id: customerId } });
    return profile?.userId ?? null;
  }
}
