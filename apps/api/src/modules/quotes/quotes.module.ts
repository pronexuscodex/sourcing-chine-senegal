import { Module } from '@nestjs/common';
import { AdminQuotesController, CustomerQuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PricingService } from '../../common/services/pricing.service';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [AdminQuotesController, CustomerQuotesController],
  providers: [QuotesService, PricingService],
})
export class QuotesModule {}
