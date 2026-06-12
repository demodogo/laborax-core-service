import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsRepository } from './repositories/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(user: AuthUserContext, query: GetPermissionsQueryDto) {
    await this.assertGlobalScope(user);
    return this.permissionsRepository.findAll(query);
  }

  async findOne(user: AuthUserContext, id: string) {
    await this.assertGlobalScope(user);
    return this.permissionsRepository.findOne(id);
  }

  async create(user: AuthUserContext, dto: CreatePermissionDto) {
    await this.assertGlobalScope(user);
    return this.permissionsRepository.create(dto);
  }

  async update(user: AuthUserContext, id: string, dto: UpdatePermissionDto) {
    await this.assertGlobalScope(user);
    return this.permissionsRepository.update(id, dto);
  }

  private async assertGlobalScope(user: AuthUserContext) {
    const scope = await this.accessScopeService.resolve(user);
    if (!scope.isGlobal) {
      throw new ForbiddenException('Permission administration requires global scope');
    }
  }
}
