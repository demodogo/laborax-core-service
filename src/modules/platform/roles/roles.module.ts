import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../outbox/outbox.module';
import { RolesController } from './roles.controller';
import { RolesRepository } from './repositories/roles.repository';
import { RolesService } from './roles.service';

@Module({
  imports: [AuthModule, DatabaseModule, OutboxModule],
  controllers: [RolesController],
  providers: [RolesRepository, RolesService],
  exports: [RolesService],
})
export class RolesModule {}
