import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateDeliveryInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async create(input: CreateDeliveryInput) {
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundException('Commande introuvable.');

    const address = await this.prisma.address.findUnique({ where: { id: input.addressId } });
    if (!address || address.customerId !== order.customerId) {
      throw new BadRequestException("Cette adresse n'appartient pas au client de la commande.");
    }

    await this.orders.updateStatus(input.orderId, 'OUT_FOR_DELIVERY');

    return this.prisma.delivery.create({
      data: { orderId: input.orderId, addressId: input.addressId },
    });
  }

  list(orderId?: string) {
    return this.prisma.delivery.findMany({
      where: orderId ? { orderId } : undefined,
      include: { address: true, order: { select: { code: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { address: true, order: { select: { code: true } } },
    });
    if (!delivery) throw new NotFoundException('Livraison introuvable.');
    return delivery;
  }

  async complete(id: string) {
    const delivery = await this.findOne(id);
    await this.orders.updateStatus(delivery.orderId, 'DELIVERED');

    return this.prisma.delivery.update({
      where: { id },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
  }
}
