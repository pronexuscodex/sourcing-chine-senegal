import { createReadStream } from 'node:fs';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { LocalDiskStorageProvider } from './storage/local-disk-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from './storage/storage-provider.interface';
import { verifyDownloadToken } from './storage/signed-download-token';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 Mo

interface UploadedMulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly config: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  @Post('upload')
  @RequirePermission('documents:upload')
  // Limites explicites : mitige les advisories DoS connues de multer (champs
  // imbriqués, fichiers non bornés) indépendamment du correctif amont — voir
  // le finding "dependency-vulnerabilities" de l'audit sécurité de ce projet.
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 5 } }))
  async upload(@CurrentUser() user: RequestUser, @UploadedFile() file?: UploadedMulterFile) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');
    return this.documents.stagedUpload(user.id, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
  }

  @Get(':id/download')
  async download(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.documents.getSignedDownloadUrl(user, id);
  }

  @Public()
  @Get('download-local/:encodedKey')
  async downloadLocal(
    @Param('encodedKey') encodedKey: string,
    @Query('expires') expires: string,
    @Query('token') token: string,
  ) {
    if (!(this.storage instanceof LocalDiskStorageProvider)) {
      throw new NotFoundException();
    }
    const key = Buffer.from(encodedKey, 'base64url').toString('utf8');
    const secret = this.config.get<string>('JWT_ACCESS_SECRET', 'dev-secret');
    if (!verifyDownloadToken(secret, key, Number(expires), token)) {
      throw new ForbiddenException('Lien expiré ou invalide.');
    }

    return new StreamableFile(createReadStream(this.storage.resolvePath(key)));
  }
}
