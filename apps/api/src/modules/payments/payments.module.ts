import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminPaymentsController, OrderPaymentController, PaymentsWebhookController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_PROVIDER } from './providers/payment-provider.interface';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { CinetPayProvider } from './providers/cinetpay.provider';

@Module({
  controllers: [OrderPaymentController, PaymentsWebhookController, AdminPaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      // Décision ARCHITECTURE.md §20 : CinetPay derrière une interface swappable.
      // PAYMENT_PROVIDER=mock par défaut en dev — bloqué en production (voir MockPaymentProvider).
      useFactory: (config: ConfigService) => {
        const selected = config.get<string>('PAYMENT_PROVIDER', 'mock');
        return selected === 'cinetpay' ? new CinetPayProvider(config) : new MockPaymentProvider();
      },
    },
  ],
})
export class PaymentsModule {}
