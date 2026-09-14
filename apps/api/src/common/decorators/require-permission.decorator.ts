import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/** Ex: @RequirePermission('orders:read:all') — voir ARCHITECTURE.md §8. */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
