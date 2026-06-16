import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CustomerContractsService } from './customer-contracts.service';
import { CreateCustomerContractDto } from './dto/create-customer-contract.dto';
import { GetCustomerContractsQueryDto } from './dto/get-customer-contracts-query.dto';
import { UpdateCustomerContractDto } from './dto/update-customer-contract.dto';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('customer-contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Customer Contracts')
@ApiBearerAuth()
export class CustomerContractsController {
  constructor(private readonly customerContractsService: CustomerContractsService) {}

  @Get()
  @RequirePermissions('platform.customer_contracts.read')
  @ApiOperation({ summary: 'Lista contratos visibles segun scope efectivo' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetCustomerContractsQueryDto) {
    return this.customerContractsService.findAll(user, query);
  }

  @Get('catalog/products')
  @RequirePermissions('platform.customer_contracts.read')
  @ApiOperation({ summary: 'Lista el catalogo de productos comerciales disponibles' })
  listProductCatalog() {
    return this.customerContractsService.listProductCatalog();
  }

  @Get(':id')
  @RequirePermissions('platform.customer_contracts.read')
  @ApiOperation({ summary: 'Obtiene un contrato visible segun scope efectivo' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.customerContractsService.findOne(user, id);
  }

  @Post()
  @RequirePermissions('platform.customer_contracts.create')
  @ApiOperation({ summary: 'Crea un contrato de cliente' })
  @AuditAction({
    action: 'platform.customer_contracts.create',
    resourceType: 'customer_contract',
  })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCustomerContractDto) {
    return this.customerContractsService.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('platform.customer_contracts.update')
  @ApiOperation({ summary: 'Actualiza un contrato de cliente' })
  @AuditAction({
    action: 'platform.customer_contracts.update',
    resourceType: 'customer_contract',
    resourceIdParam: 'id',
  })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerContractDto,
  ) {
    return this.customerContractsService.update(user, id, dto);
  }
}
