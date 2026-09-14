import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateShipmentEventInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../../common/services/code-generator.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly orders: OrdersService,
  ) {}

  async create() {
    const code = await this.codeGenerator.next('SHIP');
    return this.prisma.shipment.create({ data: { code } });
  }

  list() {
    return this.prisma.shipment.findMany({
      include: {
        packages: { include: { order: { select: { code: true } } } },
        events: { orderBy: { occurredAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        packages: { include: { order: { select: { code: true } } } },
        events: { orderBy: { occurredAt: 'desc' } },
      },
    });
    if (!shipment) throw new NotFoundException('Expédition introuvable.');
    return shipment;
  }

  /**
   * Consolidation (ARCHITECTURE.md §17) — rattache un colis inspecté à une expédition
   * et fait avancer la commande liée. Simplification MVP : un colis == une commande.
   */
  async attachPackage(shipmentId: string, packageId: string) {
    await this.findOne(shipmentId);
    const pkg = await this.prisma.warehousePackage.findUnique({ where: { id: packageId } });
    if (!pkg) throw new NotFoundException('Colis introuvable.');

    await this.orders.updateStatus(pkg.orderId, 'CONSOLIDATED');

    return this.prisma.warehousePackage.update({
      where: { id: packageId },
      data: { shipmentId, status: 'CONSOLIDATED' },
    });
  }

  /**
   * Journal d'événements — nourrit la timeline client (§19) mais ne pilote jamais
   * directement Order.status : les grandes transitions (SHIPPED, IN_TRANSIT, ...)
   * restent posées explicitement par le staff via l'endpoint générique de statut,
   * qui reste l'unique source de vérité contrôlée (ARCHITECTURE.md §7).
   */
  async addEvent(shipmentId: string, input: CreateShipmentEventInput) {
    await this.findOne(shipmentId);

    const event = await this.prisma.shipmentEvent.create({
      data: { shipmentId, type: input.type, description: input.description },
    });

    const timestampField =
      input.type === 'DEPARTED' ? 'departedAt' : input.type === 'ARRIVED' ? 'arrivedAt' : null;
    if (timestampField) {
      await this.prisma.shipment.update({ where: { id: shipmentId }, data: { [timestampField]: new Date() } });
    }

    return event;
  }
}
