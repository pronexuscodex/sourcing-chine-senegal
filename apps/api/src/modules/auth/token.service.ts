import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface AccessTokenPayload {
  sub: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

interface MfaChallengePayload {
  sub: string;
  typ: 'mfa';
}

/**
 * Access et refresh tokens signés avec des secrets distincts (ARCHITECTURE.md §8) :
 * un refresh token compromis ne permet jamais de forger un access token, et inversement.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL', '15m'),
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  signRefreshToken(userId: string, jti: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TTL', '30d'),
      },
    );
  }

  verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwt.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  signMfaChallenge(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, typ: 'mfa' },
      { secret: this.config.get<string>('JWT_ACCESS_SECRET'), expiresIn: '5m' },
    );
  }

  async verifyMfaChallenge(token: string): Promise<{ sub: string }> {
    const payload = await this.jwt.verifyAsync<MfaChallengePayload>(token, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
    });
    if (payload.typ !== 'mfa') {
      throw new Error('Type de jeton invalide.');
    }
    return { sub: payload.sub };
  }
}
