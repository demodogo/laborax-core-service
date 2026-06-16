import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import {
  customerContractProducts,
  customerContracts,
  products,
  tenants,
} from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';
import { CreateCustomerContractDto } from '../dto/create-customer-contract.dto';
import { GetCustomerContractsQueryDto } from '../dto/get-customer-contracts-query.dto';
import { UpdateCustomerContractDto } from '../dto/update-customer-contract.dto';
import type { EffectiveAccessScope } from '../../auth/services/access-scope.service';

type ContractProductView = {
  code: string;
  name: string;
  description: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
};

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

    const contracts = await db
      .select()
      .from(customerContracts)
      .where(filters.length ? and(...filters) : undefined);

    return this.attachProducts(contracts, db);
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

    const [hydratedContract] = await this.attachProducts([contract], db);
    return hydratedContract;
  }

  async create(dto: CreateCustomerContractDto) {
    const db = this.getDb();
    await this.ensureTenantExists(dto.tenantId);
    this.ensureDateRange(dto.startDate, dto.endDate);

    return db.transaction(async (tx) => {
      const [contract] = await tx
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

      if (dto.productCodes !== undefined) {
        await this.syncContractProducts(tx, contract.id, dto.productCodes);
      }

      const [hydratedContract] = await this.attachProducts([contract], tx);
      return hydratedContract;
    });
  }

  async update(id: string, dto: UpdateCustomerContractDto) {
    const db = this.getDb();
    const current = await this.findOne(id);
    const nextStartDate = dto.startDate ?? current.startDate;
    const nextEndDate = dto.endDate ?? current.endDate ?? undefined;

    this.ensureDateRange(nextStartDate, nextEndDate);

    return db.transaction(async (tx) => {
      const [contract] = await tx
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

      if (dto.productCodes !== undefined) {
        await this.syncContractProducts(tx, id, dto.productCodes);
      }

      const [hydratedContract] = await this.attachProducts([contract], tx);
      return hydratedContract;
    });
  }

  async listProductCatalog() {
    const db = this.getDb();
    return db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        description: products.description,
        status: products.status,
      })
      .from(products);
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

  private async attachProducts(
    contracts: Array<typeof customerContracts.$inferSelect>,
    db: ReturnType<typeof this.getDb>,
  ) {
    if (!contracts.length) {
      return [];
    }

    const rows = await db
      .select({
        customerContractId: customerContractProducts.customerContractId,
        status: customerContractProducts.status,
        startsAt: customerContractProducts.startsAt,
        endsAt: customerContractProducts.endsAt,
        code: products.code,
        name: products.name,
        description: products.description,
      })
      .from(customerContractProducts)
      .innerJoin(products, eq(products.id, customerContractProducts.productId))
      .where(inArray(customerContractProducts.customerContractId, contracts.map((item) => item.id)));

    const productsByContractId = new Map<string, ContractProductView[]>();

    for (const row of rows) {
      const items = productsByContractId.get(row.customerContractId) ?? [];
      items.push({
        code: row.code,
        name: row.name,
        description: row.description,
        status: row.status,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      });
      productsByContractId.set(row.customerContractId, items);
    }

    return contracts.map((contract) => {
      const contractProductsRows = productsByContractId.get(contract.id) ?? [];

      return {
        ...contract,
        products: contractProductsRows,
        enabledProductCodes: contractProductsRows
          .filter((item) => this.isProductEnabled(item.status, item.startsAt, item.endsAt))
          .map((item) => item.code),
      };
    });
  }

  private async syncContractProducts(
    db: ReturnType<typeof this.getDb>,
    customerContractId: string,
    productCodes: Array<'SCC' | 'SCA' | 'CERTIFICAX'>,
  ) {
    await db
      .delete(customerContractProducts)
      .where(eq(customerContractProducts.customerContractId, customerContractId));

    if (!productCodes.length) {
      return;
    }

    const uniqueProductCodes = Array.from(new Set(productCodes)) as Array<
      'SCC' | 'SCA' | 'CERTIFICAX'
    >;
    const catalog = await db
      .select({
        id: products.id,
        code: products.code,
      })
      .from(products)
      .where(inArray(products.code, uniqueProductCodes));

    if (catalog.length !== uniqueProductCodes.length) {
      throw new BadRequestException('One or more product codes are invalid');
    }

    await db.insert(customerContractProducts).values(
      catalog.map((product) => ({
        customerContractId,
        productId: product.id,
        status: 'ACTIVE' as const,
      })),
    );
  }

  private isProductEnabled(status: string, startsAt: string | null, endsAt: string | null) {
    if (status !== 'ACTIVE') {
      return false;
    }

    const today = new Date().toISOString().slice(0, 10);

    if (startsAt && startsAt > today) {
      return false;
    }

    if (endsAt && endsAt < today) {
      return false;
    }

    return true;
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
