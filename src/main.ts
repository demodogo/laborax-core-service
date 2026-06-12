import { NestFactory } from '@nestjs/core';
import { resolveEnv } from './config/env';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { correlationIdMiddleware } from './common/observability/correlation-id.middleware';
import { RequestLoggingInterceptor } from './common/observability/request-logging.interceptor';
import { HttpExceptionEnvelopeFilter } from './common/observability/http-exception-envelope.filter';

async function bootstrap() {
  const env = resolveEnv(process.env);
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.use(correlationIdMiddleware);
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionEnvelopeFilter());
  app.use(helmet());
  app.enableCors({
    origin: env.corsAllowedOrigins.length ? env.corsAllowedOrigins : false,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (env.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Laborax Platform Core API')
      .setDescription('API interna para identidad, RBAC, tenants, empresas y contratos base de Laborax.')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'x-client-id', in: 'header' }, 'x-client-id')
      .addApiKey({ type: 'apiKey', name: 'x-client-secret', in: 'header' }, 'x-client-secret')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(env.port);
}

bootstrap();
