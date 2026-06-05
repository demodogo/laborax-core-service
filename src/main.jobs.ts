import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppJobsModule } from './app.jobs.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppJobsModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  const logger = new Logger('CoreJobsBootstrap');
  logger.log('core-service jobs context initialized');
}

void bootstrap();
