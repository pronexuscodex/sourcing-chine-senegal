import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true — la vérification des webhooks de paiement doit opérer sur les octets
  // exacts reçus, pas sur une resérialisation du JSON parsé (ARCHITECTURE.md §16).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true });
  app.setGlobalPrefix('api/v1');
  // Validation via ZodValidationPipe par route (schémas partagés avec le frontend, @sourcing/shared),
  // pas de ValidationPipe global basé sur class-validator.
  // Limite de taille de requête (ARCHITECTURE.md §24) : le body-parser JSON par défaut
  // de Nest (100kb) reste actif ici — volontairement non redéfini pour ne pas perturber
  // la capture rawBody vérifiée par le webhook de paiement (§16). Les uploads de fichiers
  // ont leur propre limite explicite (10 Mo, voir DocumentsController).

  // Le schéma complet de l'API (routes, DTO) n'est jamais exposé publiquement en
  // production — seulement en dev/staging (ARCHITECTURE.md §24, §32).
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sourcing Platform API')
      .setDescription('Chine → Sénégal sourcing/import platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}

bootstrap();
