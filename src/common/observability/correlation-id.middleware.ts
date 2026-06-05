import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface CorrelatedRequest extends Request {
  correlationId?: string;
}

export function correlationIdMiddleware(
  request: CorrelatedRequest,
  response: Response,
  next: NextFunction,
) {
  const incomingCorrelationId = request.headers[CORRELATION_ID_HEADER];
  const correlationId =
    typeof incomingCorrelationId === 'string' && incomingCorrelationId.trim()
      ? incomingCorrelationId.trim()
      : randomUUID();

  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}
