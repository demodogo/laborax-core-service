import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { CreateServiceClientDto } from './dto/create-service-client.dto';
import { GetServiceClientsQueryDto } from './dto/get-service-clients-query.dto';
import { UpdateServiceClientDto } from './dto/update-service-client.dto';
import { ServiceClientsService } from './service-clients.service';

@Controller('service-clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Service Clients')
@ApiBearerAuth()
export class ServiceClientsController {
  constructor(private readonly serviceClientsService: ServiceClientsService) {}

  @Get()
  @RequirePermissions('platform.service_clients.read')
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetServiceClientsQueryDto) {
    return this.serviceClientsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('platform.service_clients.read')
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.serviceClientsService.findOne(user, id);
  }

  @Post()
  @RequirePermissions('platform.service_clients.create')
  @AuditAction({ action: 'platform.service_clients.create', resourceType: 'service_client' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateServiceClientDto) {
    return this.serviceClientsService.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('platform.service_clients.update')
  @AuditAction({
    action: 'platform.service_clients.update',
    resourceType: 'service_client',
    resourceIdParam: 'id',
  })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateServiceClientDto,
  ) {
    return this.serviceClientsService.update(user, id, dto);
  }

  @Post(':id/rotate-secret')
  @RequirePermissions('platform.service_clients.rotate_secret')
  @ApiOperation({ summary: 'Rota el secreto de un service client y retorna el nuevo valor una sola vez' })
  @AuditAction({
    action: 'platform.service_clients.rotate_secret',
    resourceType: 'service_client',
    resourceIdParam: 'id',
  })
  rotateSecret(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.serviceClientsService.rotateSecret(user, id);
  }

  @Post(':id/enable')
  @RequirePermissions('platform.service_clients.update')
  @ApiOperation({ summary: 'Reactiva un service client deshabilitado' })
  @AuditAction({
    action: 'platform.service_clients.enable',
    resourceType: 'service_client',
    resourceIdParam: 'id',
  })
  enable(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.serviceClientsService.enable(user, id);
  }

  @Post(':id/disable')
  @RequirePermissions('platform.service_clients.update')
  @ApiOperation({ summary: 'Deshabilita temporalmente un service client' })
  @AuditAction({
    action: 'platform.service_clients.disable',
    resourceType: 'service_client',
    resourceIdParam: 'id',
  })
  disable(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.serviceClientsService.disable(user, id);
  }

  @Post(':id/revoke')
  @RequirePermissions('platform.service_clients.update')
  @ApiOperation({ summary: 'Revoca un service client' })
  @AuditAction({
    action: 'platform.service_clients.revoke',
    resourceType: 'service_client',
    resourceIdParam: 'id',
  })
  revoke(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.serviceClientsService.revoke(user, id);
  }
}
