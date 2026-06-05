import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs';
import { AUDIT_ACTION_METADATA, AuditActionOptions } from '../decorators/audit-action.decorator';
import { AuditService } from '../audit.service';
import type { AuthUserContext } from '../../auth/types/auth-user-context.type';

interface AuditableRequest {
  method: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  correlationId?: string;
  params?: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUserContext;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const options = this.reflector.getAllAndOverride<AuditActionOptions>(
      AUDIT_ACTION_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuditableRequest>();

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        void this.auditService.record({
          actorUserId: request.user?.sub ?? null,
          actorType: request.user ? 'USER' : 'SYSTEM',
          action: options.action,
          resourceType: options.resourceType,
          resourceId: this.resolveResourceId(options, request, responseBody),
          httpMethod: request.method,
          httpPath: request.originalUrl ?? request.url,
          ipAddress: request.ip,
          userAgent: this.getSingleHeaderValue(request.headers['user-agent']),
          metadata: {
            correlationId: request.correlationId,
            requestParams: request.params ?? {},
          },
        });
      }),
    );
  }

  private resolveResourceId(
    options: AuditActionOptions,
    request: AuditableRequest,
    responseBody: unknown,
  ) {
    if (options.resourceIdParam) {
      return request.params?.[options.resourceIdParam] ?? null;
    }

    if (this.hasId(responseBody)) {
      return responseBody.id;
    }

    return null;
  }

  private hasId(value: unknown): value is { id: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof (value as { id?: unknown }).id === 'string'
    );
  }

  private getSingleHeaderValue(value?: string | string[]) {
    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }
}
