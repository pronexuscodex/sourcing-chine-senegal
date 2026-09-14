import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AUDIT_ACTION_KEY } from '../decorators/audit.decorator';

interface AuthenticatedRequest {
  user?: { id: string };
  ip: string;
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  body: unknown;
}

const REDACTED = '[redacted]';
const SENSITIVE_KEY_PATTERN = /password|passwordHash|secret|token|mfaSecret|otp|totp/i;

/**
 * Retire récursivement les champs sensibles avant écriture — un AuditLog ne doit
 * jamais contenir de mot de passe en clair ou de secret (ARCHITECTURE.md §25).
 */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redactSensitive(val),
      ]),
    );
  }
  return value;
}

/**
 * Écrit une entrée AuditLog après succès d'une route marquée @Audit(...).
 * Table append-only : jamais d'update/delete applicatif sur AuditLog (ARCHITECTURE.md §26).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string | undefined>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const before = redactSensitive(request.body ?? null);

    return next.handle().pipe(
      tap(async (result) => {
        if (!request.user) return;
        // Sur une création, :id n'existe pas encore dans l'URL — on retombe sur l'id
        // de la ressource créée (présent dans la réponse) plutôt que de perdre la traçabilité.
        const entityId = request.params?.id ?? (result as { id?: string } | null)?.id ?? 'n/a';
        await this.prisma.auditLog.create({
          data: {
            actorId: request.user.id,
            action,
            entityType: context.getClass().name,
            entityId,
            before: before as never,
            after: redactSensitive(result ?? null) as never,
            ip: request.ip,
            userAgent: String(request.headers['user-agent'] ?? ''),
          },
        });
      }),
    );
  }
}
