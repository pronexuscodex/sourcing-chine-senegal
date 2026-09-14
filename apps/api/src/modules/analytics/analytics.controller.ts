import { Controller, Get, Header, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('admin/analytics')
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  @RequirePermission('analytics:read')
  overview() {
    return this.analytics.overview();
  }

  @Get('finance/orders')
  @RequirePermission('analytics:read')
  financeByOrder(@Query('orderId') orderId?: string) {
    return this.analytics.financeByOrder(orderId);
  }

  @Get('export/orders.csv')
  @RequirePermission('analytics:read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="orders.csv"')
  exportOrdersCsv() {
    return this.analytics.exportOrdersCsv();
  }
}
