import { Injectable, NotFoundException } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { GetMembershipsQueryDto } from './dto/get-memberships-query.dto';
import { MembershipsRepository } from './repositories/memberships.repository';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly membershipsRepository: MembershipsRepository,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetMembershipsQueryDto) {
    const scope = await this.accessScopeService.resolve(user);
    return this.membershipsRepository.findAll(query, scope);
  }

  async findOne(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    return this.membershipsRepository.findOne(id, scope);
  }

  async create(user: AuthUserContext, dto: CreateMembershipDto) {
    const scope = await this.accessScopeService.resolve(user);
    this.assertTargetScope(scope, dto.tenantId ?? null, dto.companyId ?? null);
    const membership = await this.membershipsRepository.create(dto);

    await this.outboxService.publish({
      aggregateType: 'membership',
      aggregateId: membership.id,
      eventType: 'membership.created',
      payload: membership,
    });

    return membership;
  }

  async listRoles(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    await this.membershipsRepository.findOne(id, scope);
    return this.membershipsRepository.listRoles(id);
  }

  async assignRole(user: AuthUserContext, id: string, dto: AssignRoleDto) {
    const scope = await this.accessScopeService.resolve(user);
    await this.membershipsRepository.findOne(id, scope);
    const assignment = await this.membershipsRepository.assignRole(id, dto);

    await this.outboxService.publish({
      aggregateType: 'membership',
      aggregateId: id,
      eventType: 'membership.role_assigned',
      payload: {
        membershipId: id,
        roleId: dto.roleId,
        assignment,
      },
    });

    return assignment;
  }

  async removeRole(user: AuthUserContext, id: string, roleId: string) {
    const scope = await this.accessScopeService.resolve(user);
    await this.membershipsRepository.findOne(id, scope);
    const result = await this.membershipsRepository.removeRole(id, roleId);

    await this.outboxService.publish({
      aggregateType: 'membership',
      aggregateId: id,
      eventType: 'membership.role_removed',
      payload: {
        membershipId: id,
        roleId,
        result,
      },
    });

    return result;
  }

  async getEffectivePermissions(user: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(user);
    await this.membershipsRepository.findOne(id, scope);
    return this.membershipsRepository.getEffectivePermissions(id);
  }

  private assertTargetScope(
    scope: Awaited<ReturnType<AccessScopeService['resolve']>>,
    tenantId: string | null,
    companyId: string | null,
  ) {
    if (scope.isGlobal) {
      return;
    }

    if (companyId && scope.companyIds.includes(companyId)) {
      return;
    }

    if (tenantId && this.accessScopeService.canAccessTenant(scope, tenantId)) {
      return;
    }

    throw new NotFoundException('Membership target is outside of effective scope');
  }
}
