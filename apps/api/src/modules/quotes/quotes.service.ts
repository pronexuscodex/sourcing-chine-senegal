import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUOTE_STATUS_TRANSITIONS, type CreateQuoteInput, type QuoteStatus } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../../common/services/code-generator.service';
import { PricingService } from '../../common/services/pricing.service';
import { OrdersService } from '../orders/orders.service';

// Champs internes jamais exposés à un rôle CUSTOMER (ARCHITECTURE.md §10, §14).
const INTERNAL_QUOTE_ITEM_FIELDS = ['realCost', 'margin'] as const;

// Inclut la description du RequestItem d'origine (ni RequestItem ni SourcingRequest.code/
// destination ne contiennent de champ de coût interne — sûr à renvoyer au CUSTOMER aussi).
// Le strip realCost/margin pour un CUSTOMER se fait séparément via toCustomerSafeQuote.
const QUOTE_INCLUDE = {
  items: {
    include: {
      requestItem: {
        select: { description: true, quantity: true, productLink: true, color: true, size: true },
      },
      supplier: { select: { name: true, platform: true } },
    },
  },
  request: { select: { code: true, destination: true } },
} as const;

function toCustomerSafeQuote<T extends { items: Record<string, unknown>[] }>(quote: T) {
  return {
    ...quote,
    items: quote.items.map((item) => {
      const safe = { ...item };
      for (const field of INTERNAL_QUOTE_ITEM_FIELDS) delete safe[field];
      return safe;
    }),
  };
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly pricing: PricingService,
    private readonly orders: OrdersService,
    private readonly events: EventEmitter2,
  ) {}

  async create(actorId: string, input: CreateQuoteInput) {
    const request = await this.prisma.sourcingRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new NotFoundException('Demande de sourcing introuvable.');

    const code = await this.codeGenerator.next('QUOTE');

    return this.prisma.quote.create({
      data: {
        code,
        requestId: input.requestId,
        currency: input.currency,
        exchangeRateUsed: input.exchangeRateUsed,
        validUntil: new Date(input.validUntil),
        createdBy: actorId,
        items: {
          create: input.items.map((item) => {
            const computed = this.pricing.computeQuoteItem(item);
            return {
              requestItemId: item.requestItemId,
              supplierId: item.supplierId,
              productCost: item.productCost,
              chinaInlandShipping: item.chinaInlandShipping,
              supplierFees: item.supplierFees,
              qualityControlFee: item.qualityControlFee,
              consolidationFee: item.consolidationFee,
              internationalFreight: item.internationalFreight,
              otherCosts: item.otherCosts,
              serviceFee: computed.serviceFee,
              realCost: computed.realCost,
              clientPrice: computed.clientPrice,
              margin: computed.margin,
            };
          }),
        },
      },
      include: QUOTE_INCLUDE,
    });
  }

  listAll(requestId?: string, status?: string) {
    return this.prisma.quote.findMany({
      where: {
        requestId: requestId ?? undefined,
        status: status ?? undefined,
      },
      include: QUOTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAny(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id }, include: QUOTE_INCLUDE });
    if (!quote) throw new NotFoundException('Devis introuvable.');
    return quote;
  }

  async send(id: string) {
    const updated = await this.transition(id, 'SENT');

    const request = await this.prisma.sourcingRequest.findUnique({
      where: { id: updated.requestId },
      select: { customerId: true },
    });
    if (request) {
      this.events.emit('quote.sent', { quoteId: updated.id, customerId: request.customerId });
    }

    return updated;
  }

  async listMine(userId: string) {
    const quotes = await this.prisma.quote.findMany({
      where: { request: { customer: { userId } } },
      include: QUOTE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return quotes.map(toCustomerSafeQuote);
  }

  async findOneOwned(userId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, request: { customer: { userId } } },
      include: QUOTE_INCLUDE,
    });
    if (!quote) throw new NotFoundException('Devis introuvable.');
    return toCustomerSafeQuote(quote);
  }

  async accept(userId: string, id: string) {
    const quote = await this.assertOwnedAndFresh(userId, id);
    const updated = await this.transition(quote.id, 'ACCEPTED');

    await this.prisma.sourcingRequest.updateMany({
      where: { id: quote.requestId, status: 'IN_ANALYSIS' },
      data: { status: 'QUOTED' },
    });

    // QUOTE ACCEPTED → ORDER CREATED (ARCHITECTURE.md §15) — la commande démarre
    // à PAYMENT_PENDING ; passer à PAID est réservé au webhook du module payments.
    await this.orders.createFromAcceptedQuote(quote.id);

    return toCustomerSafeQuote(updated);
  }

  async reject(userId: string, id: string) {
    const quote = await this.assertOwnedAndFresh(userId, id);
    const updated = await this.transition(quote.id, 'REJECTED');
    return toCustomerSafeQuote(updated);
  }

  private async assertOwnedAndFresh(userId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({ where: { id, request: { customer: { userId } } } });
    if (!quote) throw new NotFoundException('Devis introuvable.');

    if (quote.status === 'SENT' && quote.validUntil < new Date()) {
      await this.prisma.quote.update({ where: { id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Ce devis a expiré.');
    }
    return quote;
  }

  private async transition(id: string, nextStatus: QuoteStatus) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Devis introuvable.');

    const allowed = QUOTE_STATUS_TRANSITIONS[quote.status as QuoteStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`Transition ${quote.status} → ${nextStatus} non autorisée.`);
    }

    return this.prisma.quote.update({
      where: { id },
      data: { status: nextStatus },
      include: QUOTE_INCLUDE,
    });
  }
}
