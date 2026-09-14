import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';

interface AuthenticatedRequest {
  user?: { id: string; permissions: string[] };
}

/**
 * Doit être déclaré après un guard d'authentification qui peuple `request.user`.
 * Refuse par défaut si aucune permission n'est explicitement accordée (least privilege).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const permissions = request.user?.permissions ?? [];
    if (!permissions.includes(required)) {
      throw new ForbiddenException(`Permission manquante: ${required}`);
    }
    return true;
  }
}
