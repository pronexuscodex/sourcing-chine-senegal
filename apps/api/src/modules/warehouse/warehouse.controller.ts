import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createQualityInspectionSchema,
  receiveWarehousePackageSchema,
  type CreateQualityInspectionInput,
  type ReceiveWarehousePackageInput,
} from '@sourcing/shared';
import { WarehouseService } from './warehouse.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/warehouse')
@Controller('admin/warehouse/packages')
export class WarehouseController {
  constructor(private readonly warehouse: WarehouseService) {}

  @Get()
  @RequirePermission('warehouse:read')
  list(@Query('orderId') orderId?: string) {
    return this.warehouse.list(orderId);
  }

  @Get(':id')
  @RequirePermission('warehouse:read')
  findOne(@Param('id') id: string) {
    return this.warehouse.findOne(id);
  }

  @Post()
  @RequirePermission('warehouse:write')
  @Audit('warehouse.package.receive')
  receive(@Body(new ZodValidationPipe(receiveWarehousePackageSchema)) body: ReceiveWarehousePackageInput) {
    return this.warehouse.receivePackage(body);
  }

  @Post(':id/inspection')
  @RequirePermission('quality-control:write')
  @Audit('warehouse.package.inspection')
  addInspection(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createQualityInspectionSchema)) body: CreateQualityInspectionInput,
  ) {
    return this.warehouse.addInspection(id, actor.id, body);
  }
}
