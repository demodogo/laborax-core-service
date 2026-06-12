import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RequireServiceScopes } from '../auth/decorators/require-service-scopes.decorator';
import { InternalServiceClientGuard } from '../auth/guards/internal-service-client.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GetTenantsInternalQueryDto } from './dto/get-tenants-internal-query.dto';
import { GetTenantsQueryDto } from './dto/get-tenants-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('tenants')
@ApiTags('Tenants')
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.tenants.read')
  @ApiOperation({ summary: 'Lista tenants visibles segun scope efectivo' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetTenantsQueryDto) {
    return this.tenantsService.findAll(user, query);
  }

  @Get('internal-reference/:id')
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('platform:read')
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  @ApiOperation({ summary: 'Obtiene un tenant para validacion interna entre servicios' })
  findOneInternal(@Param('id') id: string) {
    return this.tenantsService.findOneInternal(id);
  }

  @Get('internal-reference')
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('platform:read')
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  @ApiOperation({ summary: 'Lista tenants para reconciliacion interna entre servicios' })
  findAllInternal(@Query() query: GetTenantsInternalQueryDto) {
    return this.tenantsService.findAllInternal(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.tenants.read')
  @ApiOperation({ summary: 'Obtiene un tenant visible segun scope efectivo' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.tenantsService.findOne(user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.tenants.create')
  @ApiOperation({ summary: 'Crea un tenant tecnico de plataforma' })
  @AuditAction({ action: 'platform.tenants.create', resourceType: 'tenant' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.tenants.update')
  @ApiOperation({ summary: 'Actualiza un tenant existente' })
  @AuditAction({
    action: 'platform.tenants.update',
    resourceType: 'tenant',
    resourceIdParam: 'id',
  })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(user, id, dto);
  }
}
