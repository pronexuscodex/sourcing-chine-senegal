import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateQualityInspectionInput, ReceiveWarehousePackageInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../../common/services/code-generator.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly orders: OrdersService,
  ) {}

  async receivePackage(input: ReceiveWarehousePackageInput) {
    // Valide ET applique la transition de la commande avant de créer le colis —
    // échoue proprement si la commande n'est pas au bon stade (ARCHITECTURE.md §17).
    await this.orders.updateStatus(input.orderId, 'AT_CHINA_WAREHOUSE');

    const code = await this.codeGenerator.next('PKG');
    return this.prisma.warehousePackage.create({
      data: { code, orderId: input.orderId, photos: input.photos },
    });
  }

  list(orderId?: string) {
    return this.prisma.warehousePackage.findMany({
      where: orderId ? { orderId } : undefined,
      include: { inspections: true, order: { select: { code: true } } },
      orderBy: { receivedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const pkg = await this.prisma.warehousePackage.findUnique({
      where: { id },
      include: { inspections: true, order: { select: { code: true } }, shipment: { select: { code: true } } },
    });
    if (!pkg) throw new NotFoundException('Colis introuvable.');
    return pkg;
  }

  async addInspection(packageId: string, actorId: string, input: CreateQualityInspectionInput) {
    const pkg = await this.findOne(packageId);

    const inspection = await this.prisma.qualityInspection.create({
      data: { packageId, inspectedById: actorId, ...input },
    });

    // Première inspection d'un colis fraîchement reçu → fait avancer la commande liée.
    // Simplification MVP : un colis == une commande ; le multi-colis par commande
    // (consolidation partielle) est laissé pour V2.
    if (pkg.status === 'RECEIVED') {
      await this.prisma.warehousePackage.update({ where: { id: packageId }, data: { status: 'INSPECTED' } });
      await this.orders.updateStatus(pkg.orderId, 'QUALITY_CHECK');
    }

    return inspection;
  }
}
