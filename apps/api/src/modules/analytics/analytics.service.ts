import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_CUSTOMER_WINDOW_DAYS = 30;
const IN_PROGRESS_TERMINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED'];

interface OrderFinanceRow {
  orderId: string;
  orderCode: string;
  status: string;
  currency: string;
  revenue: number;
  productCost: number;
  shipping: number;
  otherCosts: number;
  serviceFee: number;
  grossMargin: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard admin (ARCHITECTURE.md §21) — chiffre d'affaires, marge, commandes,
   * demandes de sourcing, taux de conversion, clients actifs, litiges, délais moyens.
   * Aucune de ces valeurs (notamment la marge) n'est jamais exposée côté client (§22).
   */
  async overview() {
    const activeCustomerSince = new Date(Date.now() - ACTIVE_CUSTOMER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [
      revenueAgg,
      marginAgg,
      ordersTotal,
      ordersInProgress,
      disputedOrders,
      sourcingRequestsTotal,
      sourcingRequestsPending,
      activeCustomers,
      deliveredWithDates,
    ] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amountPaid: true }, where: { status: 'PAID' } }),
      this.prisma.quoteItem.aggregate({ _sum: { margin: true }, where: { orderItem: { isNot: null } } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: { notIn: IN_PROGRESS_TERMINAL_STATUSES } } }),
      this.prisma.order.count({ where: { status: 'DISPUTED' } }),
      this.prisma.sourcingRequest.count(),
      this.prisma.sourcingRequest.count({ where: { status: { in: ['RECEIVED', 'IN_ANALYSIS'] } } }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: activeCustomerSince } },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      this.prisma.delivery.findMany({
        where: { status: 'DELIVERED', deliveredAt: { not: null } },
        include: { order: { select: { createdAt: true } } },
      }),
    ]);

    const conversionRatePercent =
      sourcingRequestsTotal > 0 ? Math.round((ordersTotal / sourcingRequestsTotal) * 10000) / 100 : 0;

    const averageDeliveryDays = deliveredWithDates.length
      ? Math.round(
          (deliveredWithDates.reduce(
            (sum, d) => sum + (d.deliveredAt!.getTime() - d.order.createdAt.getTime()),
            0,
          ) /
            deliveredWithDates.length /
            (1000 * 60 * 60 * 24)) *
            10,
        ) / 10
      : null;

    return {
      revenue: revenueAgg._sum.amountPaid ?? 0,
      grossMargin: marginAgg._sum.margin ?? 0,
      ordersTotal,
      ordersInProgress,
      disputedOrders,
      sourcingRequestsTotal,
      sourcingRequestsPending,
      conversionRatePercent,
      activeCustomersLast30Days: activeCustomers.length,
      averageDeliveryDays,
    };
  }

  /** Détail financier par commande (ARCHITECTURE.md §22) — réservé FINANCE/MANAGER/ADMIN. */
  async financeByOrder(orderId?: string): Promise<OrderFinanceRow[]> {
    const orders = await this.prisma.order.findMany({
      where: orderId ? { id: orderId } : undefined,
      include: { items: { include: { quoteItem: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const totals = order.items.reduce(
        (acc, item) => {
          const qi = item.quoteItem;
          acc.productCost += qi.productCost;
          acc.shipping += qi.chinaInlandShipping + qi.internationalFreight;
          acc.otherCosts += qi.supplierFees + qi.qualityControlFee + qi.consolidationFee + qi.otherCosts;
          acc.serviceFee += qi.serviceFee;
          acc.grossMargin += qi.margin;
          acc.revenue += qi.clientPrice;
          return acc;
        },
        { productCost: 0, shipping: 0, otherCosts: 0, serviceFee: 0, grossMargin: 0, revenue: 0 },
      );

      return {
        orderId: order.id,
        orderCode: order.code,
        status: order.status,
        currency: order.currency,
        ...totals,
      };
    });
  }

  async exportOrdersCsv(): Promise<string> {
    const rows = await this.financeByOrder();
    const header = [
      'Code',
      'Statut',
      'Devise',
      'Revenu',
      'Cout produit',
      'Transport',
      'Autres couts',
      'Frais de service',
      'Marge brute',
    ];
    const lines = rows.map((r) =>
      [r.orderCode, r.status, r.currency, r.revenue, r.productCost, r.shipping, r.otherCosts, r.serviceFee, r.grossMargin].join(
        ',',
      ),
    );
    return [header.join(','), ...lines].join('\n');
  }
}
