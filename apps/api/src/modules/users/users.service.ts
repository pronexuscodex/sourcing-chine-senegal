import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, type CreateStaffUserInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';

// ADMIN et SUPER_ADMIN partagent la permission 'users:write:roles', mais un ADMIN
// ne doit jamais pouvoir créer/promouvoir un pair ou un supérieur (ARCHITECTURE.md §9,
// principe de moindre privilège) — seul un SUPER_ADMIN attribue ces deux rôles.
const ELEVATED_ROLES: string[] = [Role.ADMIN, Role.SUPER_ADMIN];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
  ) {}

  list(roleName?: string) {
    return this.prisma.user.findMany({
      where: roleName ? { role: { name: roleName } } : undefined,
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        mfaEnabled: true,
        role: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaffUser(actorUserId: string, input: CreateStaffUserInput) {
    await this.assertCanGrant(actorUserId, input.roleName);

    const role = await this.prisma.role.findUnique({ where: { name: input.roleName } });
    if (!role) throw new NotFoundException('Rôle inconnu.');

    const passwordHash = await this.password.hash(input.password);
    return this.prisma.user.create({
      data: { email: input.email, passwordHash, roleId: role.id },
      select: { id: true, email: true, role: { select: { name: true } } },
    });
  }

  async changeRole(actorUserId: string, targetUserId: string, roleName: string) {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException('Vous ne pouvez pas modifier votre propre rôle.');
    }
    await this.assertCanGrant(actorUserId, roleName);

    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new NotFoundException('Rôle inconnu.');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { roleId: role.id },
      select: { id: true, role: { select: { name: true } } },
    });
  }

  private async assertCanGrant(actorUserId: string, roleName: string): Promise<void> {
    if (!ELEVATED_ROLES.includes(roleName)) return;

    const actor = await this.prisma.user.findUniqueOrThrow({
      where: { id: actorUserId },
      include: { role: true },
    });
    if (actor.role.name !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(`Seul un ${Role.SUPER_ADMIN} peut attribuer le rôle ${roleName}.`);
    }
  }
}
