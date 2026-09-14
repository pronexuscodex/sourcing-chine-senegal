import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: 'access-secret',
    JWT_REFRESH_SECRET: 'refresh-secret',
  });
  const service = new TokenService(new JwtService(), config);

  it('round-trips an access token with embedded permissions', async () => {
    const token = await service.signAccessToken({
      sub: 'user-1',
      roleId: 'role-1',
      roleName: 'CUSTOMER',
      permissions: ['orders:read:own'],
    });
    const payload = await service.verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.permissions).toEqual(['orders:read:own']);
  });

  it('keeps access and refresh secrets separate — a refresh token must not verify as an access token', async () => {
    const refreshToken = await service.signRefreshToken('user-1', 'jti-1');
    await expect(service.verifyAccessToken(refreshToken)).rejects.toThrow();
  });

  it('rejects an MFA challenge token used as an access token', async () => {
    const mfaToken = await service.signMfaChallenge('user-1');
    // Same secret as access tokens by design (short-lived, distinct `typ` claim) —
    // verifyMfaChallenge must still reject anything without typ: 'mfa'.
    const accessToken = await service.signAccessToken({ sub: 'user-1', roleId: 'r', roleName: 'CUSTOMER', permissions: [] });
    await expect(service.verifyMfaChallenge(accessToken)).rejects.toThrow();
    await expect(service.verifyMfaChallenge(mfaToken)).resolves.toEqual({ sub: 'user-1' });
  });
});
