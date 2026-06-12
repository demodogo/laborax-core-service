import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { OutboxService } from '../outbox/outbox.service';
import { PasswordService } from '../auth/services/password.service';
import { CreateServiceClientDto } from './dto/create-service-client.dto';
import { GetServiceClientsQueryDto } from './dto/get-service-clients-query.dto';
import { UpdateServiceClientDto } from './dto/update-service-client.dto';
import { ServiceClientsRepository } from './repositories/service-clients.repository';

@Injectable()
export class ServiceClientsService {
  constructor(
    private readonly serviceClientsRepository: ServiceClientsRepository,
    private readonly passwordService: PasswordService,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetServiceClientsQueryDto) {
    await this.assertGlobalScope(user);
    return this.serviceClientsRepository.findAll(query);
  }

  async findOne(user: AuthUserContext, id: string) {
    await this.assertGlobalScope(user);
    return this.serviceClientsRepository.findOne(id);
  }

  async create(user: AuthUserContext, dto: CreateServiceClientDto) {
    await this.assertGlobalScope(user);
    const clientSecret = dto.clientSecret ?? this.generateClientSecret();
    const clientSecretHash = await this.passwordService.hash(clientSecret);
    const serviceClient = await this.serviceClientsRepository.create(dto, clientSecretHash);

    await this.outboxService.publish({
      aggregateType: 'service_client',
      aggregateId: serviceClient.id,
      eventType: 'service_client.created',
      payload: serviceClient,
    });

    return {
      ...serviceClient,
      clientSecret,
    };
  }

  async update(user: AuthUserContext, id: string, dto: UpdateServiceClientDto) {
    await this.assertGlobalScope(user);
    const serviceClient = await this.serviceClientsRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'service_client',
      aggregateId: serviceClient.id,
      eventType: 'service_client.updated',
      payload: serviceClient,
    });

    return serviceClient;
  }

  enable(user: AuthUserContext, id: string) {
    return this.update(user, id, { status: 'ACTIVE' });
  }

  disable(user: AuthUserContext, id: string) {
    return this.update(user, id, { status: 'DISABLED' });
  }

  revoke(user: AuthUserContext, id: string) {
    return this.update(user, id, { status: 'REVOKED' });
  }

  async rotateSecret(user: AuthUserContext, id: string) {
    await this.assertGlobalScope(user);
    const clientSecret = this.generateClientSecret();
    const secretHash = await this.passwordService.hash(clientSecret);
    const serviceClient = await this.serviceClientsRepository.rotateSecret(
      id,
      secretHash,
      this.configService.get<number>('SERVICE_CLIENT_SECRET_GRACE_PERIOD_MINUTES', 60),
    );

    await this.outboxService.publish({
      aggregateType: 'service_client',
      aggregateId: serviceClient.id,
      eventType: 'service_client.secret_rotated',
      payload: serviceClient,
    });

    return {
      ...serviceClient,
      clientSecret,
    };
  }

  private generateClientSecret() {
    return `lxs_${randomBytes(32).toString('base64url')}`;
  }

  private async assertGlobalScope(user: AuthUserContext) {
    const scope = await this.accessScopeService.resolve(user);
    if (!scope.isGlobal) {
      throw new ForbiddenException('Service client administration requires global scope');
    }
  }
}
