import { NotFoundException, Injectable } from '@nestjs/common';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { OutboxService } from '../outbox/outbox.service';
import { CreateCustomerContractDto } from './dto/create-customer-contract.dto';
import { GetCustomerContractsQueryDto } from './dto/get-customer-contracts-query.dto';
import { UpdateCustomerContractDto } from './dto/update-customer-contract.dto';
import { CustomerContractsRepository } from './repositories/customer-contracts.repository';

@Injectable()
export class CustomerContractsService {
  constructor(
    private readonly customerContractsRepository: CustomerContractsRepository,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetCustomerContractsQueryDto) {
    const scope = await this.accessScopeService.resolve(user);
    return this.customerContractsRepository.findAll(query, scope);
  }

  async findOne(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    return this.customerContractsRepository.findOne(id, scope);
  }

  async create(user: AuthUserContext, dto: CreateCustomerContractDto) {
    const scope = await this.accessScopeService.resolve(user);
    if (!this.accessScopeService.canAccessTenant(scope, dto.tenantId)) {
      throw new NotFoundException('Customer contract tenant is outside of effective scope');
    }

    const contract = await this.customerContractsRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'customer_contract',
      aggregateId: contract.id,
      eventType: 'customer_contract.created',
      payload: contract,
    });

    return contract;
  }

  async update(user: AuthUserContext, id: string, dto: UpdateCustomerContractDto) {
    await this.findOne(user, id);
    const contract = await this.customerContractsRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'customer_contract',
      aggregateId: contract.id,
      eventType: 'customer_contract.updated',
      payload: contract,
    });

    return contract;
  }
}
