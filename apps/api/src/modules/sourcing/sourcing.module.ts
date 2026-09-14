import { Module } from '@nestjs/common';
import { AdminSourcingController, SourcingController } from './sourcing.controller';
import { SourcingService } from './sourcing.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  controllers: [SourcingController, AdminSourcingController],
  providers: [SourcingService],
})
export class SourcingModule {}
