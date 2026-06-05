import { Injectable } from '@nestjs/common';
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
  ) {}

  findAll(query: GetRolesQueryDto) {
    return this.rolesRepository.findAll(query);
  }

  findOne(id: string) {
    return this.rolesRepository.findOne(id);
  }

  async create(dto: CreateRoleDto) {
    const role = await this.rolesRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: role.id,
      eventType: 'role.created',
      payload: role,
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.rolesRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'role',
      aggregateId: role.id,
      eventType: 'role.updated',
      payload: role,
    });

    return role;
  }

  listPermissions(id: string) {
    return this.rolesRepository.listPermissions(id);
  }

  async assignPermission(id: string, dto: AssignRolePermissionDto) {
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

  async removePermission(id: string, permissionId: string) {
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
}
