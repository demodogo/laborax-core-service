import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { GetRolesQueryDto } from './dto/get-roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Roles')
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('platform.roles.read')
  @ApiOperation({ summary: 'Lista roles' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetRolesQueryDto) {
    return this.rolesService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('platform.roles.read')
  @ApiOperation({ summary: 'Obtiene un rol' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.rolesService.findOne(user, id);
  }

  @Post()
  @RequirePermissions('platform.roles.create')
  @ApiOperation({ summary: 'Crea un rol' })
  @AuditAction({ action: 'platform.roles.create', resourceType: 'role' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('platform.roles.update')
  @ApiOperation({ summary: 'Actualiza un rol' })
  @AuditAction({ action: 'platform.roles.update', resourceType: 'role', resourceIdParam: 'id' })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(user, id, dto);
  }

  @Get(':id/permissions')
  @RequirePermissions('platform.roles.read')
  @ApiOperation({ summary: 'Lista permissions asignados a un rol' })
  listPermissions(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.rolesService.listPermissions(user, id);
  }

  @Post(':id/permissions')
  @RequirePermissions('platform.roles.assign_permission')
  @ApiOperation({ summary: 'Asigna un permission a un rol' })
  @AuditAction({
    action: 'platform.roles.assign_permission',
    resourceType: 'role',
    resourceIdParam: 'id',
  })
  assignPermission(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: AssignRolePermissionDto,
  ) {
    return this.rolesService.assignPermission(user, id, dto);
  }

  @Delete(':id/permissions/:permissionId')
  @RequirePermissions('platform.roles.assign_permission')
  @ApiOperation({ summary: 'Remueve un permission de un rol' })
  @AuditAction({
    action: 'platform.roles.remove_permission',
    resourceType: 'role',
    resourceIdParam: 'id',
  })
  removePermission(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.removePermission(user, id, permissionId);
  }
}
