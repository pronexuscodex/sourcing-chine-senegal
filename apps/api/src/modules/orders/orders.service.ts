import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../../common/services/code-generator.service';

// Séquence "chemin heureux" utilisée pour construire la timeline client (§19) —
// CANCELLED/DISPUTED sont des branches d'exception, pas des étapes affichées dans l'ordre.
const HAPPY_PATH: OrderStatus[] = [
  'QUOTE_PENDING',
  'QUOTE_SENT',
  'QUOTE_ACCEPTED',
  'PAYMENT_PENDING',
  'PAID',
  'ORDERED',
  'SUPPLIER_PROCESSING',
  'READY_FOR_SHIPMENT',
  'AT_CHINA_WAREHOUSE',
  'QUALITY_CHECK',
  'CONSOLIDATED',
  'SHIPPED',
  'IN_TRANSIT',
  'ARRIVED_SENEGAL',
  'CUSTOMS_PROCESSING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Appelée par QuotesService.accept — jamais exposée directement via une route,
   * l'unique porte d'entrée vers la création d'une commande est un devis accepté.
   */
  async createFromAcceptedQuote(quoteId: string) {
    const existing = await this.prisma.order.findUnique({ where: { quoteId } });
    if (existing) return existing;

    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true, request: true },
    });
    if (!quote) throw new NotFoundException('Devis introuvable.');

    const code = await this.codeGenerator.next('ORD');
    const totalAmount = quote.items.reduce((sum, item) => sum + item.clientPrice, 0);

    const order = await this.prisma.order.create({
      data: {
        code,
        quoteId: quote.id,
        customerId: quote.request.customerId,
        status: 'PAYMENT_PENDING',
        totalAmount,
        currency: quote.currency,
        items: {
          create: quote.items.map((item) => ({ quoteItemId: item.id })),
        },
      },
      include: { items: true },
    });

    this.events.emit('order.status.changed', {
      orderId: order.id,
      customerId: order.customerId,
      status: order.status,
    });

    return order;
  }

  listMine(userId: string) {
    return this.prisma.order.findMany({
      where: { customer: { userId } },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customer: { userId } },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async tracking(userId: string, id: string) {
    const order = await this.findOneOwned(userId, id);
    const currentIndex = HAPPY_PATH.indexOf(order.status as OrderStatus);

    // La timeline = Order.status (autoritaire) + ShipmentEvent (détail descriptif),
    // jamais une table dupliquée à maintenir manuellement (ARCHITECTURE.md §11, §19).
    const packages = await this.prisma.warehousePackage.findMany({
      where: { orderId: id },
      select: { shipmentId: true },
    });
    const shipmentIds = packages.map((p) => p.shipmentId).filter((sid): sid is string => sid !== null);
    const events = shipmentIds.length
      ? await this.prisma.shipmentEvent.findMany({
          where: { shipmentId: { in: shipmentIds } },
          orderBy: { occurredAt: 'asc' },
          select: { type: true, description: true, occurredAt: true },
        })
      : [];

    return {
      code: order.code,
      status: order.status,
      steps: HAPPY_PATH.map((step, index) => ({
        step,
        state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending',
      })),
      events,
    };
  }

  listAll(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { items: true, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAny(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: { select: { firstName: true, lastName: true, addresses: true } },
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable.');
    return order;
  }

  async updateStatus(id: string, nextStatus: OrderStatus) {
    // PAID ne doit jamais être posé manuellement — uniquement par le webhook du
    // prestataire de paiement une fois le module payments en place (ARCHITECTURE.md §16).
    if (nextStatus === 'PAID') {
      throw new BadRequestException(
        "Le statut PAID ne peut être posé que par le webhook de paiement, pas manuellement.",
      );
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable.');

    const allowed = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`Transition ${order.status} → ${nextStatus} non autorisée.`);
    }

    const updated = await this.prisma.order.update({ where: { id }, data: { status: nextStatus } });

    this.events.emit('order.status.changed', {
      orderId: updated.id,
      customerId: updated.customerId,
      status: updated.status,
    });

    return updated;
  }
}
