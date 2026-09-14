import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createQuoteSchema, type CreateQuoteInput } from '@sourcing/shared';
import { QuotesService } from './quotes.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/quotes')
@Controller('admin/quotes')
export class AdminQuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  @RequirePermission('quotes:read')
  listAll(@Query('requestId') requestId?: string, @Query('status') status?: string) {
    return this.quotes.listAll(requestId, status);
  }

  @Get(':id')
  @RequirePermission('quotes:read')
  findOne(@Param('id') id: string) {
    return this.quotes.findOneAny(id);
  }

  @Post()
  @RequirePermission('quotes:write')
  @Audit('quotes.create')
  create(@CurrentUser() actor: RequestUser, @Body(new ZodValidationPipe(createQuoteSchema)) body: CreateQuoteInput) {
    return this.quotes.create(actor.id, body);
  }

  @Patch(':id/send')
  @RequirePermission('quotes:write')
  @Audit('quotes.send')
  send(@Param('id') id: string) {
    return this.quotes.send(id);
  }
}

@ApiTags('quotes')
@Controller('quotes')
export class CustomerQuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get('mine')
  @RequirePermission('quotes:read:own')
  listMine(@CurrentUser() user: RequestUser) {
    return this.quotes.listMine(user.id);
  }

  @Get(':id')
  @RequirePermission('quotes:read:own')
  findOneOwned(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.quotes.findOneOwned(user.id, id);
  }

  @Post(':id/accept')
  @RequirePermission('quotes:respond:own')
  @Audit('quotes.accept')
  accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.quotes.accept(user.id, id);
  }

  @Post(':id/reject')
  @RequirePermission('quotes:respond:own')
  @Audit('quotes.reject')
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.quotes.reject(user.id, id);
  }
}
