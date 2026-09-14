import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Exempte une route du JwtAuthGuard global (ex: login, register, webhooks, health checks). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
