import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('refuses to construct when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => new MockPaymentProvider()).toThrow();
  });

  it('constructs fine outside production', () => {
    process.env.NODE_ENV = 'test';
    expect(() => new MockPaymentProvider()).not.toThrow();
  });

  it('parses a valid webhook payload into a verified event', async () => {
    process.env.NODE_ENV = 'test';
    const provider = new MockPaymentProvider();
    const body = Buffer.from(JSON.stringify({ orderTransactionId: 'pay-1', amount: 50_000, status: 'SUCCEEDED' }));

    const event = await provider.verifyAndParseWebhook(body, {});

    expect(event).toEqual({
      providerTransactionId: 'mock-txn-pay-1',
      orderTransactionId: 'pay-1',
      amount: 50_000,
      status: 'SUCCEEDED',
    });
  });

  it('returns null for malformed or incomplete payloads', async () => {
    process.env.NODE_ENV = 'test';
    const provider = new MockPaymentProvider();

    await expect(provider.verifyAndParseWebhook(Buffer.from('not json'), {})).resolves.toBeNull();
    await expect(
      provider.verifyAndParseWebhook(Buffer.from(JSON.stringify({ amount: 100 })), {}),
    ).resolves.toBeNull();
  });

  it('produces the same providerTransactionId for a replayed payload (idempotency key stability)', async () => {
    process.env.NODE_ENV = 'test';
    const provider = new MockPaymentProvider();
    const body = Buffer.from(JSON.stringify({ orderTransactionId: 'pay-2', amount: 1000, status: 'SUCCEEDED' }));

    const first = await provider.verifyAndParseWebhook(body, {});
    const second = await provider.verifyAndParseWebhook(body, {});

    expect(first?.providerTransactionId).toBe(second?.providerTransactionId);
  });
});
