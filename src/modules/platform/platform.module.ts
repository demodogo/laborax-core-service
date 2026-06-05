import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';
import { RequestLoggingInterceptor } from '../../common/observability/request-logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { CustomerContractsModule } from './customer-contracts/customer-contracts.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { InternalCustomersModule } from './internal-customers/internal-customers.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OutboxModule } from './outbox/outbox.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { ServiceClientsModule } from './service-clients/service-clients.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    OutboxModule,
    UsersModule,
    RolesModule,
    ServiceClientsModule,
    PermissionsModule,
    MembershipsModule,
    InternalCustomersModule,
    TenantsModule,
    CompaniesModule,
    CustomerContractsModule,
    DatabaseModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class PlatformModule {}
