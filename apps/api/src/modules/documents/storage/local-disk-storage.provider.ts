import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import type { StorageProvider } from './storage-provider.interface';
import { signDownloadToken } from './signed-download-token';

/**
 * Stockage disque local — dev/tests uniquement, jamais en production (pas de
 * durabilité, pas de réplication). Simule des URLs signées via un token HMAC
 * à expiration plutôt que d'exposer les fichiers sans contrôle.
 */
export class LocalDiskStorageProvider implements StorageProvider {
  readonly name = 'LOCAL_DISK';
  private readonly rootDir: string;
  private readonly secret: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('LocalDiskStorageProvider ne doit jamais être utilisé en production.');
    }
    this.rootDir = config.get<string>('LOCAL_STORAGE_DIR', join(process.cwd(), '.uploads'));
    this.secret = config.get<string>('JWT_ACCESS_SECRET', 'dev-secret');
    this.publicUrl = config.get<string>('API_PUBLIC_URL', 'http://localhost:4000');
  }

  async upload(key: string, buffer: Buffer, _mimeType: string): Promise<void> {
    const filePath = join(this.rootDir, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const token = signDownloadToken(this.secret, key, expiresAt);
    // base64url plutôt que encodeURIComponent : évite tout piège de slash dans un
    // segment de route Express — la clé peut contenir des "/" (chemins de dossier).
    const encodedKey = Buffer.from(key, 'utf8').toString('base64url');
    return `${this.publicUrl}/api/v1/documents/download-local/${encodedKey}?expires=${expiresAt}&token=${token}`;
  }

  resolvePath(key: string): string {
    return join(this.rootDir, key);
  }
}
