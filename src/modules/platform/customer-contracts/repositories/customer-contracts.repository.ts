import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { customerContracts, tenants } from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';
import { CreateCustomerContractDto } from '../dto/create-customer-contract.dto';
import { GetCustomerContractsQueryDto } from '../dto/get-customer-contracts-query.dto';
import { UpdateCustomerContractDto } from '../dto/update-customer-contract.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';

@Injectable()
export class CustomerContractsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(query: GetCustomerContractsQueryDto, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [];

    if (scope && !scope.isGlobal) {
      if (!scope.tenantIds.length) {
        return [];
      }

      filters.push(inArray(customerContracts.tenantId, scope.tenantIds));
    }

    if (query.tenantId) {
      filters.push(eq(customerContracts.tenantId, query.tenantId));
    }

    if (query.status) {
      filters.push(eq(customerContracts.status, query.status));
    }

    if (query.search) {
      const searchFilter = or(
        ilike(customerContracts.contractNumber, `%${query.search}%`),
        ilike(customerContracts.notes, `%${query.search}%`),
      );

      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    return db
      .select()
      .from(customerContracts)
      .where(filters.length ? and(...filters) : undefined);
  }

  async findOne(id: string, scope?: EffectiveAccessScope) {
    const db = this.getDb();
    const filters: SQL[] = [eq(customerContracts.id, id)];

    if (scope && !scope.isGlobal) {
      if (!scope.tenantIds.length) {
        throw new NotFoundException('Customer contract not found');
      }

      filters.push(inArray(customerContracts.tenantId, scope.tenantIds));
    }

    const [contract] = await db
      .select()
      .from(customerContracts)
      .where(and(...filters))
      .limit(1);

    if (!contract) {
      throw new NotFoundException('Customer contract not found');
    }

    return contract;
  }

  async create(dto: CreateCustomerContractDto) {
    const db = this.getDb();
    await this.ensureTenantExists(dto.tenantId);
    this.ensureDateRange(dto.startDate, dto.endDate);

    const [contract] = await db
      .insert(customerContracts)
      .values({
        tenantId: dto.tenantId,
        contractNumber: dto.contractNumber ?? null,
        status: dto.status ?? 'DRAFT',
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        notes: dto.notes ?? null,
      })
      .returning();

    return contract;
  }

  async update(id: string, dto: UpdateCustomerContractDto) {
    const db = this.getDb();
    const current = await this.findOne(id);
    const nextStartDate = dto.startDate ?? current.startDate;
    const nextEndDate = dto.endDate ?? current.endDate ?? undefined;

    this.ensureDateRange(nextStartDate, nextEndDate);

    const [contract] = await db
      .update(customerContracts)
      .set({
        contractNumber: dto.contractNumber,
        status: dto.status,
        startDate: dto.startDate,
        endDate: dto.endDate,
        notes: dto.notes,
        updatedAt: new Date(),
      })
      .where(eq(customerContracts.id, id))
      .returning();

    return contract;
  }

  private async ensureTenantExists(tenantId: string) {
    const db = this.getDb();
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw new BadRequestException('Tenant does not exist');
    }
  }

  private ensureDateRange(startDate: string, endDate?: string | null) {
    if (!endDate) {
      return;
    }

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      throw new BadRequestException('Contract endDate must be greater than or equal to startDate');
    }
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
