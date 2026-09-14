import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateAddressInput, UpdateCustomerProfileInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
      include: { addresses: true },
    });
    if (!profile) throw new NotFoundException("Profil client introuvable.");
    return profile;
  }

  async updateProfile(userId: string, input: UpdateCustomerProfileInput) {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException("Profil client introuvable.");

    return this.prisma.customerProfile.update({ where: { userId }, data: input });
  }

  async listAddresses(userId: string) {
    const profile = await this.prisma.customerProfile.findUniqueOrThrow({ where: { userId } });
    return this.prisma.address.findMany({ where: { customerId: profile.id }, orderBy: { createdAt: 'desc' } });
  }

  async addAddress(userId: string, input: CreateAddressInput) {
    const profile = await this.prisma.customerProfile.findUniqueOrThrow({ where: { userId } });
    return this.prisma.address.create({ data: { ...input, customerId: profile.id } });
  }
}
