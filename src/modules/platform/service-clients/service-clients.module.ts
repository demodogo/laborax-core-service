import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ServiceClientsRepository } from './repositories/service-clients.repository';
import { ServiceClientsController } from './service-clients.controller';
import { ServiceClientsService } from './service-clients.service';

@Module({
  imports: [AuthModule, DatabaseModule, OutboxModule],
  controllers: [ServiceClientsController],
  providers: [ServiceClientsRepository, ServiceClientsService],
})
export class ServiceClientsModule {}
