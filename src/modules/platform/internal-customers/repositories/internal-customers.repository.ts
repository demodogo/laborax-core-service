import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import {
  companies,
  customerContracts,
  membershipRoles,
  memberships,
  outboxEvents,
  roles,
  tenants,
  users,
} from '../../../../database/schemas';
import { DatabaseService } from '../../database/database.service';
import { CreateInternalCustomerDto } from '../dto/create-internal-customer.dto';
import { ChileanRut } from '../../../../common/domain/chilean-rut';
import { slugify } from '../../../../common/utils/slugify';

@Injectable()
export class InternalCustomersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(dto: CreateInternalCustomerDto, passwordHash: string) {
    const db = this.getDb();
    const slug = slugify(dto.slug ?? dto.name);
    const companyRut = ChileanRut.normalize(dto.companyRut);

    if (!slug) {
      throw new BadRequestException('Tenant slug could not be generated');
    }
    const adminEmail = dto.adminEmail.toLowerCase();

    this.ensureDateRange(dto.contractStartDate, dto.contractEndDate);

    return db.transaction(async (tx) => {
      const [existingTenant] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(or(eq(tenants.slug, slug), eq(tenants.name, dto.name)))
        .limit(1);

      if (existingTenant) {
        throw new ConflictException('Tenant name or slug already exists');
      }

      const [existingCompany] = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(or(eq(companies.rut, companyRut), eq(companies.legalName, dto.companyLegalName)))
        .limit(1);

      if (existingCompany) {
        throw new ConflictException('Company rut or legal name already exists');
      }

      const [existingUser] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingUser) {
        throw new ConflictException('Admin email already exists');
      }

      const [customerAdminRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.slug, 'customer_admin'), eq(roles.scope, 'TENANT')))
        .limit(1);

      if (!customerAdminRole) {
        throw new ConflictException('customer_admin role is not seeded');
      }

      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: dto.name,
          slug,
          status: 'ACTIVE',
        })
        .returning();

      const [company] = await tx
        .insert(companies)
        .values({
          tenantId: tenant.id,
          legalName: dto.companyLegalName,
          tradeName: dto.companyTradeName ?? dto.companyLegalName,
          rut: companyRut,
          type: 'OWNER',
          status: 'ACTIVE',
          path: '/pending',
          depth: 0,
        })
        .returning();

      const [normalizedCompany] = await tx
        .update(companies)
        .set({
          path: `/${company.id}`,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, company.id))
        .returning();

      const [contract] = await tx
        .insert(customerContracts)
        .values({
          tenantId: tenant.id,
          contractNumber: dto.contractNumber ?? null,
          status: 'ACTIVE',
          startDate: dto.contractStartDate,
          endDate: dto.contractEndDate ?? null,
          notes: dto.contractNotes ?? null,
        })
        .returning();

      const [adminUser] = await tx
        .insert(users)
        .values({
          type: 'CUSTOMER',
          email: adminEmail,
          passwordHash,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          isEmailVerified: false,
          status: 'ACTIVATED',
        })
        .returning();

      const [membership] = await tx
        .insert(memberships)
        .values({
          userId: adminUser.id,
          tenantId: tenant.id,
          companyId: normalizedCompany.id,
          scope: 'TENANT',
          status: 'ACTIVE',
          validFrom: new Date().toISOString().slice(0, 10),
        })
        .returning();

      await tx.insert(membershipRoles).values({
        membershipId: membership.id,
        roleId: customerAdminRole.id,
      });

      await tx.insert(outboxEvents).values([
        {
          aggregateType: 'tenant',
          aggregateId: tenant.id,
          eventType: 'tenant.created',
          payload: tenant,
        },
        {
          aggregateType: 'company',
          aggregateId: normalizedCompany.id,
          eventType: 'company.created',
          payload: normalizedCompany,
        },
        {
          aggregateType: 'customer_contract',
          aggregateId: contract.id,
          eventType: 'customer_contract.created',
          payload: contract,
        },
        {
          aggregateType: 'user',
          aggregateId: adminUser.id,
          eventType: 'user.created',
          payload: {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            type: adminUser.type,
            status: adminUser.status,
          },
        },
        {
          aggregateType: 'membership',
          aggregateId: membership.id,
          eventType: 'membership.created',
          payload: membership,
        },
        {
          aggregateType: 'membership',
          aggregateId: membership.id,
          eventType: 'membership.role_assigned',
          payload: {
            membershipId: membership.id,
            roleId: customerAdminRole.id,
          },
        },
      ]);

      return {
        tenant,
        ownerCompany: normalizedCompany,
        contract,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          type: adminUser.type,
          status: adminUser.status,
        },
        membership,
      };
    });
  }

  private ensureDateRange(startDate: string, endDate?: string | null) {
    if (!endDate) {
      return;
    }

    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      throw new BadRequestException(
        'Contract endDate must be greater than or equal to startDate',
      );
    }
  }

  private getDb() {
    if (!this.databaseService.db) {
      throw new ServiceUnavailableException('Database connection is not configured');
    }

    return this.databaseService.db;
  }
}
