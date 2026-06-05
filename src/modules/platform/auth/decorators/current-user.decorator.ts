import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserContext } from '../types/auth-user-context.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserContext | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUserContext }>();
    return request.user;
  },
);
