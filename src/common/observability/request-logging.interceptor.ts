import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { catchError, tap } from 'rxjs';
import type { CorrelatedRequest } from './correlation-id.middleware';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<CorrelatedRequest>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logRequest(request, response.statusCode, Date.now() - startedAt);
      }),
      catchError((error: unknown) => {
        const statusCode = this.resolveStatusCode(error);
        this.logRequest(request, statusCode, Date.now() - startedAt);
        throw error;
      }),
    );
  }

  private logRequest(
    request: CorrelatedRequest,
    statusCode: number,
    durationMs: number,
  ) {
    this.logger.log({
      correlationId: request.correlationId,
      method: request.method,
      path: request.originalUrl ?? request.url,
      statusCode,
      durationMs,
    });
  }

  private resolveStatusCode(error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'getStatus' in error &&
      typeof (error as { getStatus?: unknown }).getStatus === 'function'
    ) {
      return (error as { getStatus: () => number }).getStatus();
    }

    return 500;
  }
}
