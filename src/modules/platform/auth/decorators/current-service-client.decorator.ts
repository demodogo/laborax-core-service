import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ServiceClientContext } from '../types/service-client-context.type';

export const CurrentServiceClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ServiceClientContext | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      serviceClient?: ServiceClientContext;
    }>();
    return request.serviceClient;
  },
);
