import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SERVICE_SCOPES_METADATA } from '../decorators/require-service-scopes.decorator';
import { AuthRepository } from '../repositories/auth.repository';
import { PasswordService } from '../services/password.service';
import type { ServiceClientContext } from '../types/service-client-context.type';

@Injectable()
export class InternalServiceClientGuard implements CanActivate {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      serviceClient?: ServiceClientContext;
    }>();

    const clientId = this.getHeaderValue(request.headers['x-client-id']);
    const clientSecret = this.getHeaderValue(request.headers['x-client-secret']);

    if (!clientId || !clientSecret) {
      throw new UnauthorizedException('Missing internal service credentials');
    }

    const serviceClient = await this.authRepository.findServiceClientByClientId(
      clientId,
    );

    if (!serviceClient || serviceClient.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid internal service client');
    }

    const activeSecrets = await this.authRepository.findActiveSecretsForServiceClient(
      serviceClient.id,
    );

    let matchedSecretId: string | null = null;
    for (const activeSecret of activeSecrets) {
      const isValidSecret = await this.passwordService.compare(
        clientSecret,
        activeSecret.secretHash,
      );

      if (isValidSecret) {
        matchedSecretId = activeSecret.id;
        break;
      }
    }

    if (!matchedSecretId) {
      throw new UnauthorizedException('Invalid internal service secret');
    }

    await this.authRepository.touchServiceClientLastUsedAt(serviceClient.id);
    await this.authRepository.touchServiceClientSecretLastUsedAt(matchedSecretId);

    request.serviceClient = {
      id: serviceClient.id,
      clientId: serviceClient.clientId,
      allowedScopes: serviceClient.allowedScopes,
      status: serviceClient.status,
    };

    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_SERVICE_SCOPES_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (requiredScopes?.length) {
      const hasAllScopes = requiredScopes.every((scope) =>
        serviceClient.allowedScopes.includes(scope),
      );

      if (!hasAllScopes) {
        throw new ForbiddenException('Internal service client lacks required scopes');
      }
    }

    return true;
  }

  private getHeaderValue(value?: string | string[]) {
    if (!value || Array.isArray(value)) {
      return null;
    }

    return value;
  }
}
