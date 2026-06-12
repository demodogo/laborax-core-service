import { BadRequestException, Injectable } from '@nestjs/common';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { OutboxService } from '../outbox/outbox.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { GetCompaniesInternalQueryDto } from './dto/get-companies-internal-query.dto';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompaniesRepository } from './repositories/companies.repository';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetCompaniesQueryDto) {
    const scope = await this.accessScopeService.resolve(user);
    return this.companiesRepository.findAll(query, scope);
  }

  async findOne(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    return this.companiesRepository.findOne(id, scope);
  }

  async findOneInternal(id: string) {
    return this.companiesRepository.findOne(id);
  }

  async findAllInternal(query: GetCompaniesInternalQueryDto) {
    return this.companiesRepository.findAllInternal(query);
  }

  async create(user: AuthUserContext, dto: CreateCompanyDto) {
    const scope = await this.accessScopeService.resolve(user);

    if (dto.parentCompanyId) {
      const parentCompany = await this.companiesRepository.findOne(dto.parentCompanyId, scope);
      if (parentCompany.tenantId !== dto.tenantId) {
        throw new BadRequestException('Parent company must belong to the same tenant');
      }
    }

    const company = await this.companiesRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'company',
      aggregateId: company.id,
      eventType: 'company.created',
      payload: company,
    });

    return company;
  }

  async update(user: AuthUserContext, id: string, dto: UpdateCompanyDto) {
    const scope = await this.accessScopeService.resolve(user);
    await this.companiesRepository.findOne(id, scope);
    const company = await this.companiesRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'company',
      aggregateId: company.id,
      eventType: 'company.updated',
      payload: company,
    });

    return company;
  }
}
