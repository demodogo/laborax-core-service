import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository, CreateAuditLogInput } from './repositories/audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  async record(input: CreateAuditLogInput) {
    try {
      return await this.auditRepository.create(input);
    } catch (error) {
      this.logger.error('Audit log write failed', error instanceof Error ? error.stack : undefined);
      return null;
    }
  }
}
