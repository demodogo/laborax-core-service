import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import { AuthRepository } from '../repositories/auth.repository';
import type { AuthUserContext } from '../types/auth-user-context.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authRepository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!requiredPermissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUserContext }>();

    if (!request.user?.sub) {
      throw new ForbiddenException('Missing user context');
    }

    const effectivePermissions =
      await this.authRepository.getEffectivePermissionSlugsForUser(request.user.sub);

    const hasAllPermissions = requiredPermissions.every((permission) =>
      effectivePermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
