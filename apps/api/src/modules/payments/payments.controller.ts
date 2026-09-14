import { BadRequestException, Controller, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';

interface MinimalRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
}

@ApiTags('orders')
@Controller('orders')
export class OrderPaymentController {
  constructor(private readonly payments: PaymentsService) {}

  @Post(':id/payment-intent')
  @RequirePermission('payments:create:own')
  createIntent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.payments.createIntent(user.id, id);
  }
}

@ApiTags('payments')
@Controller('payments/webhook')
export class PaymentsWebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post(':provider')
  @HttpCode(200)
  async webhook(@Req() request: RawBodyRequest<MinimalRequest>) {
    if (!request.rawBody) {
      // Ne devrait jamais arriver (rawBody:true est global) — signale une régression de config.
      throw new BadRequestException('Corps de requête brut indisponible.');
    }
    if (request.params.provider?.toUpperCase() !== this.payments.providerName) {
      // Webhook adressé à un prestataire différent de celui actuellement configuré — on
      // répond 200 sans traiter (aucune retry infinie côté prestataire), mais on n'exécute rien.
      return { received: true };
    }
    await this.payments.handleWebhook(request.rawBody, request.headers);
    return { received: true };
  }
}

@ApiTags('admin/payments')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @RequirePermission('payments:read:all')
  listAll(@Query('status') status?: string) {
    return this.payments.listAll(status);
  }

  @Get(':id')
  @RequirePermission('payments:read:all')
  findOne(@Param('id') id: string) {
    return this.payments.findOne(id);
  }
}
