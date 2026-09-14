import { redactSensitive } from './audit.interceptor';

describe('redactSensitive', () => {
  it('redacts sensitive keys at the top level', () => {
    const result = redactSensitive({ email: 'a@b.com', password: 'hunter2' });
    expect(result).toEqual({ email: 'a@b.com', password: '[redacted]' });
  });

  it('redacts sensitive keys nested inside objects and arrays', () => {
    const result = redactSensitive({
      user: { email: 'a@b.com', passwordHash: 'abc', mfaSecret: 'xyz' },
      items: [{ token: 'jwt', ok: true }],
    });
    expect(result).toEqual({
      user: { email: 'a@b.com', passwordHash: '[redacted]', mfaSecret: '[redacted]' },
      items: [{ token: '[redacted]', ok: true }],
    });
  });

  it('leaves non-sensitive values untouched', () => {
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive('plain-string')).toBe('plain-string');
    expect(redactSensitive({ orderId: '123', amount: 5000 })).toEqual({ orderId: '123', amount: 5000 });
  });
});
