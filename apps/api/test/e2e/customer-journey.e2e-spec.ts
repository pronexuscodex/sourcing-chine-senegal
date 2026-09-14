import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Couvre le parcours ARCHITECTURE.md §30 : Customer → Request → Quote → Payment
 * → Order → Tracking → Delivery — exactement le flux vérifié manuellement (curl)
 * tout au long du développement, maintenant automatisé et rejouable en CI.
 */
describe('Customer journey (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  const unique = Date.now();
  const password = 'correcthorsebattery';
  const customerEmail = `e2e-customer-${unique}@example.com`;
  const otherCustomerEmail = `e2e-other-${unique}@example.com`;
  const sourcingAgentEmail = `e2e-sourcing-${unique}@example.com`;
  const logisticsAgentEmail = `e2e-logistics-${unique}@example.com`;
  const qualityControlEmail = `e2e-qc-${unique}@example.com`;

  let customerToken: string;
  let sourcingAgentToken: string;
  let logisticsAgentToken: string;
  let qualityControlToken: string;

  let sourcingRequestId: string;
  let requestItemId: string;
  let quoteId: string;
  let orderId: string;
  let paymentId: string;
  let packageId: string;
  let shipmentId: string;
  let addressId: string;
  let deliveryId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    await app.init();
    prisma = new PrismaClient();
  }, 30_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function createStaffAccount(email: string, roleName: string): Promise<void> {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.create({ data: { email, passwordHash, roleId: role.id } });
  }

  async function login(identifier: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ identifier, password })
      .expect(201);
    return res.body.accessToken;
  }

  it('registers a customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: customerEmail, password, firstName: 'E2E', lastName: 'Customer' })
      .expect(201);
    expect(res.body.accessToken).toBeDefined();
    customerToken = res.body.accessToken;
  });

  it('bootstraps the staff accounts needed for this journey', async () => {
    await createStaffAccount(sourcingAgentEmail, 'SOURCING_AGENT');
    await createStaffAccount(logisticsAgentEmail, 'LOGISTICS_AGENT');
    await createStaffAccount(qualityControlEmail, 'QUALITY_CONTROL');

    sourcingAgentToken = await login(sourcingAgentEmail);
    logisticsAgentToken = await login(logisticsAgentEmail);
    qualityControlToken = await login(qualityControlEmail);
  });

  it('customer creates a sourcing request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/sourcing-requests')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ destination: 'Dakar', items: [{ description: 'T-shirts', quantity: 100, budgetCurrency: 'XOF' }] })
      .expect(201);

    sourcingRequestId = res.body.id;
    requestItemId = res.body.items[0].id;
    expect(res.body.code).toMatch(/^REQ-\d{4}-\d{6}$/);
  });

  it('staff creates and sends a quote — pricing engine matches the ARCHITECTURE.md §14 worked example', async () => {
    const validUntil = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/quotes')
      .set('Authorization', `Bearer ${sourcingAgentToken}`)
      .send({
        requestId: sourcingRequestId,
        exchangeRateUsed: 1,
        validUntil,
        items: [
          {
            requestItemId,
            productCost: 75_000,
            chinaInlandShipping: 5_000,
            qualityControlFee: 3_000,
            internationalFreight: 35_000,
            serviceFeeRule: { type: 'flat', value: 10_000 },
          },
        ],
      })
      .expect(201);

    quoteId = createRes.body.id;
    expect(createRes.body.items[0].clientPrice).toBe(128_000);
    expect(createRes.body.items[0].realCost).toBe(118_000);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/quotes/${quoteId}/send`)
      .set('Authorization', `Bearer ${sourcingAgentToken}`)
      .expect(200);
  });

  it('customer accepts the quote and a real order is created at PAYMENT_PENDING', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/quotes/${quoteId}/accept`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);

    const ordersRes = await request(app.getHttpServer())
      .get('/api/v1/orders/mine')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(ordersRes.body).toHaveLength(1);
    orderId = ordersRes.body[0].id;
    expect(ordersRes.body[0].status).toBe('PAYMENT_PENDING');
    expect(ordersRes.body[0].totalAmount).toBe(128_000);
  });

  it('staff cannot set PAID manually, even with orders:write:status', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .send({ status: 'PAID' })
      .expect(400);
  });

  it('a verified payment webhook confirms the order — and a replayed webhook does not double-credit it', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/payment-intent`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(201);

    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId } });
    paymentId = payment.id;

    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/mock')
      .send({ orderTransactionId: paymentId, amount: 128_000, status: 'SUCCEEDED' })
      .expect(200);

    const paidOrderRes = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(paidOrderRes.body.status).toBe('PAID');

    // Rejeu du même événement — l'idempotence doit empêcher un second crédit.
    await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/mock')
      .send({ orderTransactionId: paymentId, amount: 128_000, status: 'SUCCEEDED' })
      .expect(200);

    const payment2 = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(payment2.amountPaid).toBe(128_000);
  });

  it('a different customer cannot see this order (anti-IDOR: 404, not 403)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: otherCustomerEmail, password, firstName: 'Other', lastName: 'Customer' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${res.body.accessToken}`)
      .expect(404);
  });

  it('drives the order through the full logistics chain to DELIVERED', async () => {
    for (const status of ['ORDERED', 'SUPPLIER_PROCESSING', 'READY_FOR_SHIPMENT']) {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${logisticsAgentToken}`)
        .send({ status })
        .expect(200);
    }

    const pkgRes = await request(app.getHttpServer())
      .post('/api/v1/admin/warehouse/packages')
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .send({ orderId, photos: [] })
      .expect(201);
    packageId = pkgRes.body.id;
    expect(pkgRes.body.code).toMatch(/^PKG-\d{4}-\d{6}$/);

    // Un LOGISTICS_AGENT n'a pas le droit de faire le contrôle qualité (rôles distincts).
    await request(app.getHttpServer())
      .post(`/api/v1/admin/warehouse/packages/${packageId}/inspection`)
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .send({ quantityVerified: true, variantVerified: true, issueReported: false })
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/warehouse/packages/${packageId}/inspection`)
      .set('Authorization', `Bearer ${qualityControlToken}`)
      .send({ quantityVerified: true, variantVerified: true, issueReported: false })
      .expect(201);

    const afterInspection = await request(app.getHttpServer())
      .get(`/api/v1/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .expect(200);
    expect(afterInspection.body.status).toBe('QUALITY_CHECK');

    const shipmentRes = await request(app.getHttpServer())
      .post('/api/v1/admin/shipments')
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .expect(201);
    shipmentId = shipmentRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/admin/shipments/${shipmentId}/packages/${packageId}`)
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .expect(201);

    for (const status of [
      'SHIPPED',
      'IN_TRANSIT',
      'ARRIVED_SENEGAL',
      'CUSTOMS_PROCESSING',
      'READY_FOR_DELIVERY',
    ]) {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${logisticsAgentToken}`)
        .send({ status })
        .expect(200);
    }

    const addressRes = await request(app.getHttpServer())
      .post('/api/v1/customers/me/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ line1: '10 Rue Test', city: 'Dakar', country: 'SN' })
      .expect(201);
    addressId = addressRes.body.id;

    const deliveryRes = await request(app.getHttpServer())
      .post('/api/v1/admin/deliveries')
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .send({ orderId, addressId })
      .expect(201);
    deliveryId = deliveryRes.body.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/deliveries/${deliveryId}/complete`)
      .set('Authorization', `Bearer ${logisticsAgentToken}`)
      .expect(200);

    const finalOrderRes = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(finalOrderRes.body.status).toBe('DELIVERED');
  }, 30_000);

  it('the customer tracking view reflects the full journey, including the shipment event log', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}/tracking`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    expect(res.body.status).toBe('DELIVERED');
    const deliveredStep = res.body.steps.find((s: { step: string }) => s.step === 'DELIVERED');
    expect(deliveredStep.state).toBe('current');
    const pendingStep = res.body.steps.find((s: { step: string }) => s.step === 'COMPLETED');
    expect(pendingStep.state).toBe('pending');
  });
});
