import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { GetMembershipsQueryDto } from './dto/get-memberships-query.dto';
import { MembershipsService } from './memberships.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Memberships')
@ApiBearerAuth()
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @RequirePermissions('platform.memberships.read')
  @ApiOperation({ summary: 'Lista memberships visibles segun scope efectivo' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetMembershipsQueryDto) {
    return this.membershipsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('platform.memberships.read')
  @ApiOperation({ summary: 'Obtiene un membership visible segun scope efectivo' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.membershipsService.findOne(user, id);
  }

  @Post()
  @RequirePermissions('platform.memberships.create')
  @ApiOperation({ summary: 'Crea un membership' })
  @AuditAction({ action: 'platform.memberships.create', resourceType: 'membership' })
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Get(':id/roles')
  @RequirePermissions('platform.memberships.read')
  @ApiOperation({ summary: 'Lista roles asignados a un membership' })
  listRoles(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.membershipsService.listRoles(user, id);
  }

  @Post(':id/roles')
  @RequirePermissions('platform.memberships.assign_role')
  @ApiOperation({ summary: 'Asigna un rol a un membership' })
  @AuditAction({
    action: 'platform.memberships.assign_role',
    resourceType: 'membership',
    resourceIdParam: 'id',
  })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
    return this.membershipsService.assignRole(id, dto);
  }

  @Delete(':id/roles/:roleId')
  @RequirePermissions('platform.memberships.assign_role')
  @ApiOperation({ summary: 'Remueve un rol de un membership' })
  @AuditAction({
    action: 'platform.memberships.remove_role',
    resourceType: 'membership',
    resourceIdParam: 'id',
  })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.membershipsService.removeRole(id, roleId);
  }

  @Get(':id/permissions/effective')
  @RequirePermissions('platform.memberships.read')
  @ApiOperation({ summary: 'Obtiene permissions efectivos de un membership' })
  getEffectivePermissions(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.membershipsService.getEffectivePermissions(user, id);
  }
}
