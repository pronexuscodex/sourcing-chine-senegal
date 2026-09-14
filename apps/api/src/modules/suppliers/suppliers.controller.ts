import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createSupplierEvaluationSchema,
  createSupplierSchema,
  updateSupplierSchema,
  type CreateSupplierEvaluationInput,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '@sourcing/shared';
import { SuppliersService } from './suppliers.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/suppliers')
@Controller('admin/suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @RequirePermission('suppliers:read')
  list(@Query('platform') platform?: string) {
    return this.suppliers.list(platform);
  }

  @Get(':id')
  @RequirePermission('suppliers:read')
  findOne(@Param('id') id: string) {
    return this.suppliers.findOne(id);
  }

  @Post()
  @RequirePermission('suppliers:write')
  @Audit('suppliers.create')
  create(@Body(new ZodValidationPipe(createSupplierSchema)) body: CreateSupplierInput) {
    return this.suppliers.create(body);
  }

  @Patch(':id')
  @RequirePermission('suppliers:write')
  @Audit('suppliers.update')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSupplierSchema)) body: UpdateSupplierInput) {
    return this.suppliers.update(id, body);
  }

  @Post(':id/evaluations')
  @RequirePermission('suppliers:write')
  @Audit('suppliers.evaluation.create')
  addEvaluation(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createSupplierEvaluationSchema)) body: CreateSupplierEvaluationInput,
  ) {
    return this.suppliers.addEvaluation(id, actor.id, body);
  }
}
