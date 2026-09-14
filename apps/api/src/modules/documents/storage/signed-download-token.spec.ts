import { signDownloadToken, verifyDownloadToken } from './signed-download-token';

describe('signed download token', () => {
  const secret = 'test-secret';

  it('verifies a token signed with the same secret and key before expiry', () => {
    const expiresAt = Date.now() + 60_000;
    const token = signDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt);
    expect(verifyDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt, token)).toBe(true);
  });

  it('rejects an expired token even if the signature is otherwise valid', () => {
    const expiresAt = Date.now() - 1000;
    const token = signDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt);
    expect(verifyDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt, token)).toBe(false);
  });

  it('rejects a token for a different key (cannot be replayed across files)', () => {
    const expiresAt = Date.now() + 60_000;
    const token = signDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt);
    expect(verifyDownloadToken(secret, 'orders/other/photo.jpg', expiresAt, token)).toBe(false);
  });

  it('rejects a tampered expiry (cannot extend a token past its signed lifetime)', () => {
    const expiresAt = Date.now() + 60_000;
    const token = signDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt);
    expect(verifyDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt + 3_600_000, token)).toBe(false);
  });

  it('rejects a token signed with a different secret', () => {
    const expiresAt = Date.now() + 60_000;
    const token = signDownloadToken('wrong-secret', 'orders/abc/photo.jpg', expiresAt);
    expect(verifyDownloadToken(secret, 'orders/abc/photo.jpg', expiresAt, token)).toBe(false);
  });
});
