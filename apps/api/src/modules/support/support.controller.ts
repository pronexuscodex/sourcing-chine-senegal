import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createSupportMessageSchema,
  createSupportTicketSchema,
  updateSupportTicketStatusSchema,
  type CreateSupportMessageInput,
  type CreateSupportTicketInput,
  type UpdateSupportTicketStatusInput,
} from '@sourcing/shared';
import { SupportService } from './support.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('support')
@Controller('support/tickets')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post()
  @RequirePermission('support:create:own')
  create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(createSupportTicketSchema)) body: CreateSupportTicketInput,
  ) {
    return this.support.create(user.id, body);
  }

  @Get('mine')
  @RequirePermission('support:read:own')
  listMine(@CurrentUser() user: RequestUser) {
    return this.support.listMine(user.id);
  }

  @Get(':id')
  @RequirePermission('support:read:own')
  findOneOwned(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.support.findOneOwned(user.id, id);
  }

  @Post(':id/messages')
  @RequirePermission('support:respond:own')
  addMessage(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createSupportMessageSchema)) body: CreateSupportMessageInput,
  ) {
    return this.support.addMessageAsCustomer(user.id, id, body.body);
  }
}

@ApiTags('admin/support')
@Controller('admin/support/tickets')
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  @RequirePermission('support:read:all')
  listAll(@Query('status') status?: string) {
    return this.support.listAll(status);
  }

  @Get(':id')
  @RequirePermission('support:read:all')
  findOne(@Param('id') id: string) {
    return this.support.findOneAny(id);
  }

  @Post(':id/messages')
  @RequirePermission('support:write')
  @Audit('support.message.staff')
  addMessage(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createSupportMessageSchema)) body: CreateSupportMessageInput,
  ) {
    return this.support.addMessageAsStaff(id, actor.id, body.body);
  }

  @Patch(':id/status')
  @RequirePermission('support:write')
  @Audit('support.status.change')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSupportTicketStatusSchema)) body: UpdateSupportTicketStatusInput,
  ) {
    return this.support.updateStatus(id, body.status);
  }
}
