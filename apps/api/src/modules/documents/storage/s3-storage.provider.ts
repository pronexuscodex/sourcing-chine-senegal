import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import type { StorageProvider } from './storage-provider.interface';

/**
 * NON VÉRIFIÉ EN CONDITIONS RÉELLES — aucun bucket R2/S3 réel disponible pendant
 * le développement. L'API S3 est standardisée et R2 s'y conforme, mais valider
 * contre un vrai bucket avant mise en production (ARCHITECTURE.md §20, décision
 * "Hébergement" — Cloudflare R2).
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = 'S3';
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    const endpoint = config.get<string>('STORAGE_ENDPOINT');
    const bucket = config.get<string>('STORAGE_BUCKET');
    const accessKeyId = config.get<string>('STORAGE_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('STORAGE_SECRET_ACCESS_KEY');
    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      throw new Error('Configuration STORAGE_* incomplète pour activer S3StorageProvider.');
    }

    this.bucket = bucket;
    this.client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}
