import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateSupplierEvaluationInput, CreateSupplierInput, UpdateSupplierInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { computeEvaluationScore } from './supplier-score';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateSupplierInput) {
    return this.prisma.supplier.create({ data: input });
  }

  list(platform?: string) {
    return this.prisma.supplier.findMany({
      where: platform ? { platform } : undefined,
      orderBy: { computedScore: 'desc' },
    });
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { evaluations: { orderBy: { createdAt: 'desc' } } },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    return supplier;
  }

  async update(id: string, input: UpdateSupplierInput) {
    await this.findOne(id);
    return this.prisma.supplier.update({ where: { id }, data: input });
  }

  async addEvaluation(supplierId: string, actorId: string, input: CreateSupplierEvaluationInput) {
    await this.findOne(supplierId);
    const computedScore = computeEvaluationScore(input);

    await this.prisma.supplierEvaluation.create({
      data: { supplierId, evaluatedById: actorId, ...input, computedScore },
    });

    // Recalcul synchrone pour le MVP (pas encore de queue) — passera en job async
    // quand BullMQ sera en place (ARCHITECTURE.md §12).
    const evaluations = await this.prisma.supplierEvaluation.findMany({ where: { supplierId } });
    const average = evaluations.reduce((sum, e) => sum + e.computedScore, 0) / evaluations.length;

    return this.prisma.supplier.update({
      where: { id: supplierId },
      data: { computedScore: Math.round(average * 100) / 100 },
      include: { evaluations: { orderBy: { createdAt: 'desc' } } },
    });
  }
}
