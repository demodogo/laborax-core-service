import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { RequireServiceScopes } from '../auth/decorators/require-service-scopes.decorator';
import { InternalServiceClientGuard } from '../auth/guards/internal-service-client.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { GetCompaniesInternalQueryDto } from './dto/get-companies-internal-query.dto';
import { GetCompaniesQueryDto } from './dto/get-companies-query.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('companies')
@ApiTags('Companies')
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.companies.read')
  @ApiOperation({ summary: 'Lista companies visibles segun scope efectivo' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetCompaniesQueryDto) {
    return this.companiesService.findAll(user, query);
  }

  @Get('internal-reference/:id')
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('platform:read')
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  @ApiOperation({ summary: 'Obtiene una company para validacion interna entre servicios' })
  findOneInternal(@Param('id') id: string) {
    return this.companiesService.findOneInternal(id);
  }

  @Get('internal-reference')
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('platform:read')
  @ApiSecurity('x-client-id')
  @ApiSecurity('x-client-secret')
  @ApiOperation({ summary: 'Lista companies para reconciliacion interna entre servicios' })
  findAllInternal(@Query() query: GetCompaniesInternalQueryDto) {
    return this.companiesService.findAllInternal(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.companies.read')
  @ApiOperation({ summary: 'Obtiene una company visible segun scope efectivo' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.companiesService.findOne(user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.companies.create')
  @AuditAction({ action: 'platform.companies.create', resourceType: 'company' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('platform.companies.update')
  @AuditAction({
    action: 'platform.companies.update',
    resourceType: 'company',
    resourceIdParam: 'id',
  })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(user, id, dto);
  }
}
