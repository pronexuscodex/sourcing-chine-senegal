import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SourcingModule } from './modules/sourcing/sourcing.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { SupportModule } from './modules/support/support.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CodeGeneratorModule } from './common/code-generator.module';
import { QueueModule } from './common/queue.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Défaut global modéré ; les routes sensibles (login, register, MFA) imposent
    // une limite plus stricte via @Throttle (ARCHITECTURE.md §13/§24).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    // Découplage inter-modules par événements (ARCHITECTURE.md §12) : orders/quotes/payments
    // émettent, notifications écoute — aucun des trois premiers ne connaît le module notifications.
    EventEmitterModule.forRoot(),
    PrismaModule,
    CodeGeneratorModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    SourcingModule,
    SuppliersModule,
    QuotesModule,
    OrdersModule,
    PaymentsModule,
    WarehouseModule,
    ShipmentsModule,
    DeliveryModule,
    NotificationsModule,
    DocumentsModule,
    SupportModule,
    AnalyticsModule,
    // Modules métier ajoutés au fil des étapes (ARCHITECTURE.md §4, §44) :
    // admin (back-office regroupant les vues transverses des modules ci-dessus).
  ],
  providers: [
    // Ordre significatif : rate limiting d'abord (y compris sur les tentatives
    // non authentifiées), puis authentification, puis autorisation (ARCHITECTURE.md §8, §13).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
