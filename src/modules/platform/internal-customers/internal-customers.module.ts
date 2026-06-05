import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { InternalCustomersController } from './internal-customers.controller';
import { InternalCustomersService } from './internal-customers.service';
import { InternalCustomersRepository } from './repositories/internal-customers.repository';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [InternalCustomersController],
  providers: [InternalCustomersRepository, InternalCustomersService],
})
export class InternalCustomersModule {}
