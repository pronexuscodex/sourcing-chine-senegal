import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { STORAGE_PROVIDER } from './storage/storage-provider.interface';
import { LocalDiskStorageProvider } from './storage/local-disk-storage.provider';
import { S3StorageProvider } from './storage/s3-storage.provider';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    {
      provide: STORAGE_PROVIDER,
      inject: [ConfigService],
      // Décision ARCHITECTURE.md §20 : Cloudflare R2 (S3-compatible) derrière une
      // interface swappable. STORAGE_PROVIDER=local par défaut en dev.
      useFactory: (config: ConfigService) => {
        const selected = config.get<string>('STORAGE_PROVIDER', 'local');
        return selected === 's3' ? new S3StorageProvider(config) : new LocalDiskStorageProvider(config);
      },
    },
  ],
  exports: [DocumentsService, STORAGE_PROVIDER],
})
export class DocumentsModule {}
