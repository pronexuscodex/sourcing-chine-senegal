export interface CreatePaymentIntentInput {
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface CreatePaymentIntentResult {
  paymentUrl: string;
  providerReference: string;
}

export interface VerifiedPaymentEvent {
  providerTransactionId: string;
  orderTransactionId: string;
  amount: number;
  status: 'SUCCEEDED' | 'FAILED';
}

/**
 * Abstraction derrière laquelle tout prestataire de paiement est branché
 * (ARCHITECTURE.md §9, §16, §20) — le code métier ne dépend jamais d'un SDK
 * de prestataire directement, seulement de cette interface.
 *
 * `verifyAndParseWebhook` est volontairement async et retourne `null` en cas
 * d'échec de vérification plutôt que de lever — chaque prestataire vérifie à
 * sa façon (signature HMAC, ou ré-interrogation serveur-à-serveur pour
 * CinetPay), mais l'appelant traite toujours "non vérifié" de la même manière :
 * ignorer l'événement, ne jamais faire confiance au payload brut du webhook.
 */
export interface PaymentProvider {
  readonly name: string;
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyAndParseWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<VerifiedPaymentEvent | null>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
