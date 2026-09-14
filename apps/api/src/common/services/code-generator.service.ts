import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Génère des codes séquentiels lisibles (REQ-2026-000001, QUOTE-2026-000001, ...).
 * L'incrément est fait via un seul INSERT ... ON CONFLICT atomique côté Postgres,
 * donc sûr sous concurrence — pas de lecture-puis-écriture applicative.
 */
@Injectable()
export class CodeGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async next(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `${prefix}:${year}`;
    const rows = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO "SequenceCounter" (key, value) VALUES (${key}, 1)
      ON CONFLICT (key) DO UPDATE SET value = "SequenceCounter".value + 1
      RETURNING value
    `;
    const value = rows[0]?.value ?? 1;
    return `${prefix}-${year}-${String(value).padStart(6, '0')}`;
  }
}
