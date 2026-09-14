import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createSourcingRequestSchema,
  updateSourcingRequestStatusSchema,
  type CreateSourcingRequestInput,
  type UpdateSourcingRequestStatusInput,
} from '@sourcing/shared';
import { SourcingService } from './sourcing.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('sourcing-requests')
@Controller('sourcing-requests')
export class SourcingController {
  constructor(private readonly sourcing: SourcingService) {}

  @Post()
  @RequirePermission('sourcing-requests:create:own')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSourcingRequestSchema)) body: CreateSourcingRequestInput,
  ) {
    return this.sourcing.create(user.id, body);
  }

  @Get('mine')
  @RequirePermission('sourcing-requests:read:own')
  listMine(@CurrentUser() user: RequestUser) {
    return this.sourcing.listMine(user.id);
  }

  @Get(':id')
  @RequirePermission('sourcing-requests:read:own')
  findOneOwned(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sourcing.findOneOwned(user.id, id);
  }
}

@ApiTags('admin/sourcing-requests')
@Controller('admin/sourcing-requests')
export class AdminSourcingController {
  constructor(private readonly sourcing: SourcingService) {}

  @Get()
  @RequirePermission('sourcing-requests:read:all')
  listAll(@Query('status') status?: string) {
    return this.sourcing.listAll(status);
  }

  @Get(':id')
  @RequirePermission('sourcing-requests:read:all')
  findOne(@Param('id') id: string) {
    return this.sourcing.findOneAny(id);
  }

  @Patch(':id/status')
  @RequirePermission('sourcing-requests:write')
  @Audit('sourcing-requests.status.change')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSourcingRequestStatusSchema)) body: UpdateSourcingRequestStatusInput,
  ) {
    return this.sourcing.updateStatus(id, body.status);
  }
}
