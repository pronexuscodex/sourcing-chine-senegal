import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role, type RegisterInput } from '@sourcing/shared';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { MfaService } from './mfa.service';

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly mfa: MfaService,
  ) {}

  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { phone: input.phone }] },
    });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email ou ce téléphone.');
    }

    const customerRole = await this.prisma.role.findUniqueOrThrow({ where: { name: Role.CUSTOMER } });
    const passwordHash = await this.password.hash(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        roleId: customerRole.id,
        customerProfile: { create: { firstName: input.firstName, lastName: input.lastName } },
      },
    });

    return this.issueTokens(user.id);
  }

  async login(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user || !(await this.password.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (user.mfaEnabled) {
      return { mfaRequired: true as const, mfaChallenge: await this.tokens.signMfaChallenge(user.id) };
    }
    return this.issueTokens(user.id);
  }

  async verifyMfaAndIssueTokens(mfaChallenge: string, totpCode: string) {
    const { sub: userId } = await this.tokens.verifyMfaChallenge(mfaChallenge).catch(() => {
      throw new UnauthorizedException('Session MFA invalide ou expirée.');
    });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaEnabled || !user.mfaSecret || !this.mfa.verify(totpCode, user.mfaSecret)) {
      throw new UnauthorizedException('Code MFA invalide.');
    }
    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalide.');
    }

    const record = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!record || record.userId !== payload.sub || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée.');
    }

    // Rotation : l'ancien refresh token est immédiatement invalidé (ARCHITECTURE.md §8).
    await this.prisma.refreshToken.update({ where: { id: payload.jti }, data: { revokedAt: new Date() } });
    return this.issueTokens(payload.sub);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const { jti } = await this.tokens.verifyRefreshToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { id: jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Token déjà invalide/expiré : rien à révoquer, on ne bloque pas la déconnexion côté client.
    }
  }

  async initiateMfaEnrollment(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.mfa.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { mfaSecret: secret } });
    return { otpauthUrl: this.mfa.keyUri(user.email ?? user.phone ?? user.id, secret) };
  }

  async confirmMfaEnrollment(userId: string, totpCode: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaSecret) {
      throw new BadRequestException('Aucun enrôlement MFA en cours.');
    }
    if (!this.mfa.verify(totpCode, user.mfaSecret)) {
      throw new UnauthorizedException('Code invalide.');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  }

  private async issueTokens(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });
    const permissions = user.role.permissions.map((rp) => rp.permission.key);

    const refreshRecord = await this.prisma.refreshToken.create({
      data: { userId, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
    });

    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken({ sub: userId, roleId: user.roleId, roleName: user.role.name, permissions }),
      this.tokens.signRefreshToken(userId, refreshRecord.id),
    ]);

    return { accessToken, refreshToken };
  }
}
