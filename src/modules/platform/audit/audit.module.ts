import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuditService } from './audit.service';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditRepository } from './repositories/audit.repository';

@Module({
  imports: [DatabaseModule],
  providers: [AuditService, AuditRepository, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
