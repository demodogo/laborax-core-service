import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../outbox/outbox.module';
import { CustomerContractsController } from './customer-contracts.controller';
import { CustomerContractsService } from './customer-contracts.service';
import { CustomerContractsRepository } from './repositories/customer-contracts.repository';

@Module({
  imports: [AuthModule, DatabaseModule, OutboxModule],
  controllers: [CustomerContractsController],
  providers: [CustomerContractsService, CustomerContractsRepository],
})
export class CustomerContractsModule {}
