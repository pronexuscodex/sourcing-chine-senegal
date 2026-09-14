import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from './payment-provider.interface';

interface MockWebhookPayload {
  orderTransactionId: string;
  amount: number;
  status: 'SUCCEEDED' | 'FAILED';
}

/**
 * Prestataire factice pour le développement local et les tests — aucun appel réseau réel.
 * "Vérifie" en faisant simplement confiance au payload (il n'y a pas de vrai prestataire
 * en face), ce qui n'est acceptable qu'en dev : bloqué explicitement en production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'MOCK';

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MockPaymentProvider ne doit jamais être utilisé en production.');
    }
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const providerReference = `MOCK-${input.transactionId}`;
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    const params = new URLSearchParams({
      transactionId: input.transactionId,
      amount: String(input.amount),
      currency: input.currency,
      orderId: input.orderId,
    });
    return {
      providerReference,
      paymentUrl: `${webOrigin}/mock-checkout/${providerReference}?${params.toString()}`,
    };
  }

  async verifyAndParseWebhook(
    rawBody: Buffer,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<VerifiedPaymentEvent | null> {
    let payload: MockWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
    if (!payload.orderTransactionId || typeof payload.amount !== 'number') return null;

    return {
      providerTransactionId: `mock-txn-${payload.orderTransactionId}`,
      orderTransactionId: payload.orderTransactionId,
      amount: payload.amount,
      status: payload.status === 'SUCCEEDED' ? 'SUCCEEDED' : 'FAILED',
    };
  }
}
