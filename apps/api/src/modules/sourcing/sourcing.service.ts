import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  SOURCING_REQUEST_STATUS_TRANSITIONS,
  type CreateSourcingRequestInput,
  type SourcingRequestStatus,
} from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CodeGeneratorService } from '../../common/services/code-generator.service';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class SourcingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: CodeGeneratorService,
    private readonly documents: DocumentsService,
  ) {}

  private async getCustomerProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.customerProfile.findUniqueOrThrow({ where: { userId } });
    return profile.id;
  }

  async create(userId: string, input: CreateSourcingRequestInput) {
    const customerId = await this.getCustomerProfileId(userId);
    const code = await this.codeGenerator.next('REQ');

    const request = await this.prisma.sourcingRequest.create({
      data: {
        code,
        customerId,
        destination: input.destination,
        items: {
          create: input.items.map((item) => ({
            productLink: item.productLink,
            photoDocumentId: item.photoDocumentId,
            description: item.description,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            variants: item.variants,
            budgetAmount: item.budgetAmount,
            budgetCurrency: item.budgetCurrency,
            comments: item.comments,
          })),
        },
      },
      include: { items: true },
    });

    // Réclame les photos pré-uploadées (staging → REQUEST_ITEM, visibles par le
    // client puisque ce sont ses propres photos) — un item par input, même ordre.
    await Promise.all(
      request.items.map((item) =>
        item.photoDocumentId
          ? this.documents.claim(item.photoDocumentId, userId, 'REQUEST_ITEM', item.id, 'CUSTOMER').catch(() => {
              // Une photo non réclamable (déjà réclamée, mauvais uploader) ne doit
              // pas faire échouer la création de la demande — juste rester orpheline.
            })
          : Promise.resolve(),
      ),
    );

    return request;
  }

  async listMine(userId: string) {
    const customerId = await this.getCustomerProfileId(userId);
    return this.prisma.sourcingRequest.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOwned(userId: string, id: string) {
    const customerId = await this.getCustomerProfileId(userId);
    // findFirst (pas findUnique+ownerId check a posteriori) : une requête qui n'appartient
    // pas au client ne doit jamais être distinguable d'une requête inexistante (anti-IDOR).
    const request = await this.prisma.sourcingRequest.findFirst({
      where: { id, customerId },
      include: { items: true },
    });
    if (!request) throw new NotFoundException('Demande introuvable.');
    return request;
  }

  listAll(status?: string) {
    return this.prisma.sourcingRequest.findMany({
      where: status ? { status } : undefined,
      include: { items: true, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneAny(id: string) {
    const request = await this.prisma.sourcingRequest.findUnique({
      where: { id },
      include: { items: true, customer: true },
    });
    if (!request) throw new NotFoundException('Demande introuvable.');
    return request;
  }

  async updateStatus(id: string, nextStatus: SourcingRequestStatus) {
    const request = await this.prisma.sourcingRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Demande introuvable.');

    const allowed = SOURCING_REQUEST_STATUS_TRANSITIONS[request.status as SourcingRequestStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(`Transition ${request.status} → ${nextStatus} non autorisée.`);
    }

    return this.prisma.sourcingRequest.update({ where: { id }, data: { status: nextStatus } });
  }
}
