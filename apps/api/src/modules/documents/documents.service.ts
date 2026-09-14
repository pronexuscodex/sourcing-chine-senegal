import { randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage-provider.interface';

const SIGNED_URL_TTL_SECONDS = 5 * 60;

interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * Pré-upload générique : le fichier existe avant que l'entité qui le référence
   * n'existe (ex: photo produit envoyée avant la création de la demande de
   * sourcing). Reste en statut STAGING jusqu'à ce qu'un module métier le "réclame".
   */
  async stagedUpload(uploaderId: string, file: UploadInput) {
    const key = `staging/${uploaderId}/${randomUUID()}-${sanitizeFilename(file.originalName)}`;
    await this.storage.upload(key, file.buffer, file.mimeType);

    return this.prisma.document.create({
      data: { ownerType: 'STAGING', ownerId: uploaderId, storageKey: key, mimeType: file.mimeType, visibility: 'INTERNAL' },
    });
  }

  /**
   * Réclamation par un module métier (ex: SourcingService après création d'un
   * RequestItem) — vérifie que le document est bien en attente et appartient à
   * l'uploader avant de le rattacher définitivement.
   */
  async claim(documentId: string, uploaderId: string, ownerType: string, ownerId: string, visibility: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document || document.ownerType !== 'STAGING' || document.ownerId !== uploaderId) {
      throw new ForbiddenException('Document introuvable ou non réclamable.');
    }
    return this.prisma.document.update({
      where: { id: documentId },
      data: { ownerType, ownerId, visibility },
    });
  }

  async getSignedDownloadUrl(user: { id: string; permissions: string[] }, documentId: string) {
    const document = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Document introuvable.');

    const isStaff = user.permissions.includes('documents:read:all');
    if (!isStaff) {
      if (document.visibility !== 'CUSTOMER') throw new NotFoundException('Document introuvable.');
      const ownerCustomerId = await this.resolveOwnerCustomerId(document.ownerType, document.ownerId);
      const requestingCustomerId = await this.resolveUserCustomerId(user.id);
      if (!ownerCustomerId || ownerCustomerId !== requestingCustomerId) {
        throw new NotFoundException('Document introuvable.');
      }
    }

    const url = await this.storage.getSignedUrl(document.storageKey, SIGNED_URL_TTL_SECONDS);
    return { url, expiresInSeconds: SIGNED_URL_TTL_SECONDS };
  }

  private async resolveUserCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({ where: { userId } });
    return profile?.id ?? null;
  }

  /** Ownership par type de ressource — INSPECTION n'est jamais client-visible (§18). */
  private async resolveOwnerCustomerId(ownerType: string, ownerId: string): Promise<string | null> {
    switch (ownerType) {
      case 'REQUEST_ITEM': {
        const item = await this.prisma.requestItem.findUnique({
          where: { id: ownerId },
          include: { request: true },
        });
        return item?.request.customerId ?? null;
      }
      case 'ORDER': {
        const order = await this.prisma.order.findUnique({ where: { id: ownerId } });
        return order?.customerId ?? null;
      }
      case 'QUOTE': {
        const quote = await this.prisma.quote.findUnique({ where: { id: ownerId }, include: { request: true } });
        return quote?.request.customerId ?? null;
      }
      default:
        return null;
    }
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-100);
}
