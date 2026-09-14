import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'auditAction';

/** Marque une route comme sensible — journalisée par AuditInterceptor. Voir ARCHITECTURE.md §13/§26. */
export const Audit = (action: string) => SetMetadata(AUDIT_ACTION_KEY, action);
