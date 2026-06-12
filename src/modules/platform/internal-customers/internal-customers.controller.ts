import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { CreateInternalCustomerDto } from './dto/create-internal-customer.dto';
import { InternalCustomersService } from './internal-customers.service';

@Controller('internal-customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Internal Customers')
@ApiBearerAuth()
export class InternalCustomersController {
  constructor(private readonly internalCustomersService: InternalCustomersService) {}

  @Post()
  @RequirePermissions('platform.internal_customers.create')
  @ApiOperation({
    summary:
      'Ejecuta onboarding transaccional de un cliente interno con tenant, owner company, contrato, usuario y membership',
  })
  @AuditAction({
    action: 'platform.internal_customers.create',
    resourceType: 'internal_customer',
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateInternalCustomerDto) {
    return this.internalCustomersService.create(user, dto);
  }
}
