import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { updateOrderStatusSchema, type UpdateOrderStatusInput } from '@sourcing/shared';
import { OrdersService } from './orders.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('orders')
@Controller('orders')
export class CustomerOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('mine')
  @RequirePermission('orders:read:own')
  listMine(@CurrentUser() user: RequestUser) {
    return this.orders.listMine(user.id);
  }

  @Get(':id')
  @RequirePermission('orders:read:own')
  findOneOwned(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.findOneOwned(user.id, id);
  }

  @Get(':id/tracking')
  @RequirePermission('orders:read:own')
  tracking(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.orders.tracking(user.id, id);
  }
}

@ApiTags('admin/orders')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermission('orders:read:all')
  listAll(@Query('status') status?: string) {
    return this.orders.listAll(status);
  }

  @Get(':id')
  @RequirePermission('orders:read:all')
  findOne(@Param('id') id: string) {
    return this.orders.findOneAny(id);
  }

  @Patch(':id/status')
  @RequirePermission('orders:write:status')
  @Audit('orders.status.change')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrderStatusSchema)) body: UpdateOrderStatusInput,
  ) {
    return this.orders.updateStatus(id, body.status);
  }
}
