import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_METADATA = 'platform:audit-action';

export interface AuditActionOptions {
  action: string;
  resourceType: string;
  resourceIdParam?: string;
}

export const AuditAction = (options: AuditActionOptions) =>
  SetMetadata(AUDIT_ACTION_METADATA, options);
