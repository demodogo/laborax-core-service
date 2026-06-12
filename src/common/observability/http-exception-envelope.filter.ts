import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { CorrelatedRequest } from './correlation-id.middleware';

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionEnvelopeFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = this.normalizePayload(exception);

    if (status >= 500) {
      this.logger.error({
        correlationId: request.correlationId,
        method: request.method,
        path: request.originalUrl ?? request.url,
        statusCode: status,
        error: payload.error,
        message: payload.message,
      });
    }

    response.status(status).json({
      statusCode: status,
      error: payload.error,
      message: payload.message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      correlationId: request.correlationId ?? null,
    });
  }

  private normalizePayload(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          error: exception.name,
          message: response,
        };
      }

      if (typeof response === 'object' && response !== null) {
        const responseBody = response as {
          error?: unknown;
          message?: unknown;
        };

        return {
          error:
            typeof responseBody.error === 'string'
              ? responseBody.error
              : exception.name,
          message:
            typeof responseBody.message === 'string' ||
            Array.isArray(responseBody.message)
              ? responseBody.message
              : exception.message,
        };
      }
    }

    if (exception instanceof Error) {
      return {
        error: 'InternalServerError',
        message: exception.message,
      };
    }

    return {
      error: 'InternalServerError',
      message: 'Internal server error',
    };
  }
}
