import { PrismaClient } from '@prisma/client';

// Bootstrap RBAC — Rôles et permissions initiaux (ARCHITECTURE.md §8, §20).
// Liste volontairement minimale pour Étape 2 ; chaque nouveau module (orders, quotes, ...)
// ajoute ses propres clés de permission ici au fil des étapes.

const prisma = new PrismaClient();

const PERMISSIONS = [
  'users:read:self',
  'users:read:all',
  'users:write:roles',
  'audit:read',
  'sourcing-requests:create:own',
  'sourcing-requests:read:own',
  'sourcing-requests:read:all',
  'sourcing-requests:write',
  'suppliers:read',
  'suppliers:write',
  'quotes:read',
  'quotes:write',
  'quotes:read:own',
  'quotes:respond:own',
  'orders:read:own',
  'orders:read:all',
  'orders:write:status',
  'payments:create:own',
  'payments:read:all',
  'warehouse:read',
  'warehouse:write',
  'quality-control:write',
  'notifications:read:own',
  'notifications:read:all',
  'documents:upload',
  'documents:read:all',
  'support:create:own',
  'support:read:own',
  'support:respond:own',
  'support:read:all',
  'support:write',
  'analytics:read',
  'admin:panel:access',
] as const;

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  CUSTOMER: [
    'users:read:self',
    'sourcing-requests:create:own',
    'sourcing-requests:read:own',
    'quotes:read:own',
    'quotes:respond:own',
    'orders:read:own',
    'payments:create:own',
    'notifications:read:own',
    'documents:upload',
    'support:create:own',
    'support:read:own',
    'support:respond:own',
  ],
  SUPPORT_AGENT: [
    'users:read:self',
    'sourcing-requests:read:all',
    'orders:read:all',
    'support:read:all',
    'support:write',
  ],
  SOURCING_AGENT: [
    'users:read:self',
    'sourcing-requests:read:all',
    'sourcing-requests:write',
    'suppliers:read',
    'suppliers:write',
    'quotes:read',
    'quotes:write',
    'documents:upload',
  ],
  LOGISTICS_AGENT: [
    'users:read:self',
    'orders:read:all',
    'orders:write:status',
    'warehouse:read',
    'warehouse:write',
    'documents:upload',
  ],
  QUALITY_CONTROL: [
    'users:read:self',
    'orders:read:all',
    'warehouse:read',
    'quality-control:write',
    'documents:upload',
  ],
  FINANCE: [
    'users:read:self',
    'orders:read:all',
    'payments:read:all',
    'quotes:read',
    'quotes:write',
    'suppliers:read',
    'documents:upload',
    'documents:read:all',
    'analytics:read',
  ],
  MANAGER: [
    'users:read:self',
    'orders:read:all',
    'sourcing-requests:read:all',
    'suppliers:read',
    'quotes:read',
    'warehouse:read',
    'notifications:read:all',
    'documents:read:all',
    'support:read:all',
    'analytics:read',
    'admin:panel:access',
    'audit:read',
  ],
  ADMIN: [...PERMISSIONS],
  SUPER_ADMIN: [...PERMISSIONS],
};

async function main() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  for (const [roleName, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const key of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('Seed RBAC terminé.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
