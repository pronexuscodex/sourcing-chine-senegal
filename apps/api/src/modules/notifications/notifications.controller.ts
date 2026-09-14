import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('mine')
  @RequirePermission('notifications:read:own')
  listMine(@CurrentUser() user: RequestUser) {
    return this.notifications.listMine(user.id);
  }
}

@ApiTags('admin/notifications')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission('notifications:read:all')
  listAll(@Query('status') status?: string) {
    return this.notifications.listAll(status);
  }
}
