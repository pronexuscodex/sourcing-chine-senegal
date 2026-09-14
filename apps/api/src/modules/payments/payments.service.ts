import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly events: EventEmitter2,
  ) {}

  get providerName(): string {
    return this.provider.name;
  }

  async createIntent(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, customer: { userId } } });
    if (!order) throw new NotFoundException('Commande introuvable.');
    if (order.status !== 'PAYMENT_PENDING') {
      throw new BadRequestException('Cette commande ne peut pas être payée dans son état actuel.');
    }

    // Réutilise un Payment non-terminal existant (retry) plutôt que d'en créer un nouveau à chaque appel.
    let payment = await this.prisma.payment.findFirst({
      where: { orderId, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
    });
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: { orderId, amountDue: order.totalAmount, status: 'PENDING', provider: this.provider.name },
      });
    }

    const intent = await this.provider.createIntent({
      orderId: order.id,
      transactionId: payment.id,
      amount: payment.amountDue - payment.amountPaid,
      currency: order.currency,
    });

    return { paymentUrl: intent.paymentUrl };
  }

  /**
   * Point d'entrée du webhook — jamais authentifié par JWT (route publique), la
   * confiance vient uniquement de `provider.verifyAndParseWebhook` (ARCHITECTURE.md §16).
   * Toujours répondre 200 même si l'événement est ignoré, pour éviter des retries
   * infinis du prestataire sur des cas qu'on ne pourra jamais traiter.
   */
  async handleWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): Promise<void> {
    const event = await this.provider.verifyAndParseWebhook(rawBody, headers);
    if (!event) {
      this.logger.warn('Webhook de paiement reçu mais non vérifiable — ignoré.');
      return;
    }

    const payment = await this.prisma.payment.findUnique({ where: { id: event.orderTransactionId } });
    if (!payment) {
      this.logger.warn(`Webhook pour un paiement inconnu: ${event.orderTransactionId}`);
      return;
    }

    try {
      await this.prisma.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          providerTransactionId: event.providerTransactionId,
          amount: event.amount,
          status: event.status,
          rawWebhookPayload: JSON.parse(rawBody.toString('utf8')),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.log(`Webhook déjà traité (idempotence): ${event.providerTransactionId}`);
        return;
      }
      throw error;
    }

    if (event.status !== 'SUCCEEDED') {
      await this.prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      return;
    }

    const amountPaid = payment.amountPaid + event.amount;
    const fullyPaid = amountPaid >= payment.amountDue;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { amountPaid, status: fullyPaid ? 'PAID' : 'PARTIALLY_PAID' },
    });

    if (fullyPaid) {
      // Seul chemin légitime vers Order.status = 'PAID' — contourne volontairement
      // le garde-fou de OrdersService.updateStatus qui bloque ce statut en écriture manuelle.
      const { count } = await this.prisma.order.updateMany({
        where: { id: payment.orderId, status: 'PAYMENT_PENDING' },
        data: { status: 'PAID' },
      });

      if (count > 0) {
        const order = await this.prisma.order.findUnique({
          where: { id: payment.orderId },
          select: { customerId: true },
        });
        if (order) {
          this.events.emit('payment.confirmed', { orderId: payment.orderId, customerId: order.customerId });
        }
      }
    }
  }

  listAll(status?: string) {
    return this.prisma.payment.findMany({
      where: status ? { status } : undefined,
      include: { transactions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { transactions: true },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable.');
    return payment;
  }
}
