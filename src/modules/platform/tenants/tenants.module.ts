import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../outbox/outbox.module';
import { TenantsController } from './tenants.controller';
import { TenantsRepository } from './repositories/tenants.repository';
import { TenantsService } from './tenants.service';

@Module({
  imports: [AuthModule, DatabaseModule, OutboxModule],
  controllers: [TenantsController],
  providers: [TenantsRepository, TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
