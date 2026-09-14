import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createShipmentEventSchema, type CreateShipmentEventInput } from '@sourcing/shared';
import { ShipmentsService } from './shipments.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/shipments')
@Controller('admin/shipments')
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Get()
  @RequirePermission('warehouse:read')
  list() {
    return this.shipments.list();
  }

  @Get(':id')
  @RequirePermission('warehouse:read')
  findOne(@Param('id') id: string) {
    return this.shipments.findOne(id);
  }

  @Post()
  @RequirePermission('warehouse:write')
  @Audit('shipments.create')
  create() {
    return this.shipments.create();
  }

  @Post(':id/packages/:packageId')
  @RequirePermission('warehouse:write')
  @Audit('shipments.package.attach')
  attachPackage(@Param('id') id: string, @Param('packageId') packageId: string) {
    return this.shipments.attachPackage(id, packageId);
  }

  @Post(':id/events')
  @RequirePermission('warehouse:write')
  @Audit('shipments.event.add')
  addEvent(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createShipmentEventSchema)) body: CreateShipmentEventInput,
  ) {
    return this.shipments.addEvent(id, body);
  }
}
