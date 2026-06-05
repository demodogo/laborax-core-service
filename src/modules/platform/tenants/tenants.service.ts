import { Injectable } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GetTenantsInternalQueryDto } from './dto/get-tenants-internal-query.dto';
import { GetTenantsQueryDto } from './dto/get-tenants-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from './repositories/tenants.repository';

@Injectable()
export class TenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetTenantsQueryDto) {
    const scope = await this.accessScopeService.resolve(user);
    return this.tenantsRepository.findAll(query, scope);
  }

  async findOne(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    return this.tenantsRepository.findOne(id, scope);
  }

  async findOneInternal(id: string) {
    return this.tenantsRepository.findOne(id);
  }

  async findAllInternal(query: GetTenantsInternalQueryDto) {
    return this.tenantsRepository.findAllInternal(query);
  }

  async create(dto: CreateTenantDto) {
    const tenant = await this.tenantsRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'tenant',
      aggregateId: tenant.id,
      eventType: 'tenant.created',
      payload: tenant,
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantsRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'tenant',
      aggregateId: tenant.id,
      eventType: 'tenant.updated',
      payload: tenant,
    });

    return tenant;
  }
}
