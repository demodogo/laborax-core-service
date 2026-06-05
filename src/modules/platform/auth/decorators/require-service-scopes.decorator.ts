import { SetMetadata } from '@nestjs/common';

export const REQUIRED_SERVICE_SCOPES_METADATA = 'platform:required-service-scopes';

export const RequireServiceScopes = (...scopes: string[]) =>
  SetMetadata(REQUIRED_SERVICE_SCOPES_METADATA, scopes);
