import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  assignRoleSchema,
  createStaffUserSchema,
  type AssignRoleInput,
  type CreateStaffUserInput,
} from '@sourcing/shared';
import { UsersService } from './users.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('admin/users')
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('users:read:all')
  list(@Query('roleName') roleName?: string) {
    return this.users.list(roleName);
  }

  @Post()
  @RequirePermission('users:write:roles')
  @Audit('users.create')
  create(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(createStaffUserSchema)) body: CreateStaffUserInput,
  ) {
    return this.users.createStaffUser(actor.id, body);
  }

  @Patch(':id/role')
  @RequirePermission('users:write:roles')
  @Audit('users.role.change')
  changeRole(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignRoleSchema)) body: AssignRoleInput,
  ) {
    return this.users.changeRole(actor.id, id, body.roleName);
  }
}
