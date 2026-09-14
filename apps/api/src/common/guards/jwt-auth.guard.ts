import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '../../modules/auth/token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { RequestUser } from '../decorators/current-user.decorator';

interface RequestWithAuth {
  headers: { authorization?: string };
  user?: RequestUser;
}

/**
 * Guard global : toute route est protégée par défaut (least privilege),
 * sauf celles marquées @Public() (login, register, webhooks, health checks).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant.');
    }

    try {
      const payload = await this.tokens.verifyAccessToken(authHeader.slice('Bearer '.length));
      request.user = { id: payload.sub, roleId: payload.roleId, permissions: payload.permissions };
      return true;
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré.');
    }
  }
}
