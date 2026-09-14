import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createDeliverySchema, type CreateDeliveryInput } from '@sourcing/shared';
import { DeliveryService } from './delivery.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/deliveries')
@Controller('admin/deliveries')
export class DeliveryController {
  constructor(private readonly delivery: DeliveryService) {}

  @Get()
  @RequirePermission('warehouse:read')
  list(@Query('orderId') orderId?: string) {
    return this.delivery.list(orderId);
  }

  @Get(':id')
  @RequirePermission('warehouse:read')
  findOne(@Param('id') id: string) {
    return this.delivery.findOne(id);
  }

  @Post()
  @RequirePermission('warehouse:write')
  @Audit('delivery.create')
  create(@Body(new ZodValidationPipe(createDeliverySchema)) body: CreateDeliveryInput) {
    return this.delivery.create(body);
  }

  @Patch(':id/complete')
  @RequirePermission('warehouse:write')
  @Audit('delivery.complete')
  complete(@Param('id') id: string) {
    return this.delivery.complete(id);
  }
}
