import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
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
  ) {}

  findAll(query: GetServiceClientsQueryDto) {
    return this.serviceClientsRepository.findAll(query);
  }

  findOne(id: string) {
    return this.serviceClientsRepository.findOne(id);
  }

  async create(dto: CreateServiceClientDto) {
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

  async update(id: string, dto: UpdateServiceClientDto) {
    const serviceClient = await this.serviceClientsRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'service_client',
      aggregateId: serviceClient.id,
      eventType: 'service_client.updated',
      payload: serviceClient,
    });

    return serviceClient;
  }

  enable(id: string) {
    return this.update(id, { status: 'ACTIVE' });
  }

  disable(id: string) {
    return this.update(id, { status: 'DISABLED' });
  }

  revoke(id: string) {
    return this.update(id, { status: 'REVOKED' });
  }

  async rotateSecret(id: string) {
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
}
