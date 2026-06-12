import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { OutboxService } from '../outbox/outbox.service';
import { AssignRolePermissionDto } from './dto/assign-role-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { GetRolesQueryDto } from './dto/get-roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesRepository } from './repositories/roles.repository';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetRolesQueryDto) {
    const scope = await this.accessScopeService.resolve(user);
    return this.rolesRepository.findAll(query, scope);
  }

  async findOne(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    return this.rolesRepository.findOne(id, scope);
  }

  async create(user: AuthUserContext, dto: CreateRoleDto) {
    const scope = await this.accessScopeService.resolve(user);
    this.assertRoleTargetScope(scope, dto.scope, dto.tenantId ?? null);
    const role = await this.rolesRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: role.id,
      eventType: 'role.created',
      payload: role,
    });

    return role;
  }

  async update(user: AuthUserContext, id: string, dto: UpdateRoleDto) {
    const scope = await this.accessScopeService.resolve(user);
    const currentRole = await this.rolesRepository.findOne(id, scope);
    this.assertRoleTargetScope(scope, dto.scope ?? currentRole.scope, dto.tenantId ?? currentRole.tenantId);
    const role = await this.rolesRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: role.id,
      eventType: 'role.updated',
      payload: role,
    });

    return role;
  }

  async listPermissions(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    await this.rolesRepository.findOne(id, scope);
    return this.rolesRepository.listPermissions(id);
  }

  async assignPermission(user: AuthUserContext, id: string, dto: AssignRolePermissionDto) {
    const scope = await this.accessScopeService.resolve(user);
    await this.rolesRepository.findOne(id, scope);
    const assignment = await this.rolesRepository.assignPermission(id, dto);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: id,
      eventType: 'role.permission_assigned',
      payload: {
        roleId: id,
        permissionId: dto.permissionId,
        assignment,
      },
    });

    return assignment;
  }

  async removePermission(user: AuthUserContext, id: string, permissionId: string) {
    const scope = await this.accessScopeService.resolve(user);
    await this.rolesRepository.findOne(id, scope);
    const result = await this.rolesRepository.removePermission(id, permissionId);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: id,
      eventType: 'role.permission_removed',
      payload: {
        roleId: id,
        permissionId,
        result,
      },
    });

    return result;
  }

  private assertRoleTargetScope(
    scope: Awaited<ReturnType<AccessScopeService['resolve']>>,
    roleScope: string,
    tenantId: string | null,
  ) {
    if (roleScope === 'GLOBAL') {
      if (!scope.isGlobal) {
        throw new ForbiddenException('Global roles require global scope');
      }
      return;
    }

    if (!tenantId) {
      throw new ForbiddenException('Scoped role requires tenantId');
    }

    if (!scope.isGlobal && !this.accessScopeService.canAccessTenant(scope, tenantId)) {
      throw new ForbiddenException('Role target is outside of effective scope');
    }
  }
}
