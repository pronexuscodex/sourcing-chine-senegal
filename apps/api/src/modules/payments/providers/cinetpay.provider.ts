import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
  VerifiedPaymentEvent,
} from './payment-provider.interface';

const CHECKOUT_URL = 'https://api-checkout.cinetpay.com/v2/payment';
const CHECK_STATUS_URL = 'https://api-checkout.cinetpay.com/v2/payment/check';

interface CinetPayWebhookBody {
  cpm_trans_id?: string;
}

/**
 * NON VÉRIFIÉ EN CONDITIONS RÉELLES — implémenté d'après la documentation publique
 * de CinetPay (aucun accès sandbox/API key disponible pendant le développement).
 * À valider contre le sandbox CinetPay réel avant la mise en production
 * (ARCHITECTURE.md §20, décision "Paiement").
 *
 * CinetPay ne signe pas ses webhooks par HMAC : la vérification recommandée est
 * une ré-interrogation serveur-à-serveur de leur endpoint "check" avec le
 * transaction_id reçu, plutôt qu'une confiance dans le payload du webhook lui-même.
 */
@Injectable()
export class CinetPayProvider implements PaymentProvider {
  readonly name = 'CINETPAY';
  private readonly logger = new Logger(CinetPayProvider.name);
  private readonly apiKey: string;
  private readonly siteId: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('CINETPAY_API_KEY');
    const siteId = this.config.get<string>('CINETPAY_SITE_ID');
    if (!apiKey || !siteId) {
      throw new Error('CINETPAY_API_KEY / CINETPAY_SITE_ID manquants pour activer CinetPayProvider.');
    }
    this.apiKey = apiKey;
    this.siteId = siteId;
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const response = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: input.transactionId,
        amount: input.amount,
        currency: input.currency,
        description: `Commande ${input.orderId}`,
        notify_url: this.config.get<string>('CINETPAY_NOTIFY_URL'),
        customer_email: input.customerEmail,
        customer_phone_number: input.customerPhone,
      }),
    });
    const body = await response.json();
    if (body.code !== '201' || !body.data?.payment_url) {
      this.logger.error(`Échec de création d'intention CinetPay: ${JSON.stringify(body)}`);
      throw new Error("Impossible de créer l'intention de paiement CinetPay.");
    }
    return { paymentUrl: body.data.payment_url, providerReference: input.transactionId };
  }

  async verifyAndParseWebhook(
    rawBody: Buffer,
    _headers: Record<string, string | string[] | undefined>,
  ): Promise<VerifiedPaymentEvent | null> {
    let payload: CinetPayWebhookBody;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return null;
    }
    const transactionId = payload.cpm_trans_id;
    if (!transactionId) return null;

    // Ne jamais faire confiance au statut annoncé par le webhook — on interroge
    // CinetPay directement pour confirmer (ARCHITECTURE.md §16).
    const check = await fetch(CHECK_STATUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: this.apiKey, site_id: this.siteId, transaction_id: transactionId }),
    });
    const result = await check.json();
    const status = result?.data?.status;
    if (!status) {
      this.logger.warn(`Vérification CinetPay sans statut exploitable: ${JSON.stringify(result)}`);
      return null;
    }

    return {
      providerTransactionId: transactionId,
      orderTransactionId: transactionId,
      amount: Number(result.data.amount ?? 0),
      status: status === 'ACCEPTED' ? 'SUCCEEDED' : 'FAILED',
    };
  }
}
