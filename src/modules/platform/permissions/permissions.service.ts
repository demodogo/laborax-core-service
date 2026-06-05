import { Injectable } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsRepository } from './repositories/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  findAll(query: GetPermissionsQueryDto) {
    return this.permissionsRepository.findAll(query);
  }

  findOne(id: string) {
    return this.permissionsRepository.findOne(id);
  }

  create(dto: CreatePermissionDto) {
    return this.permissionsRepository.create(dto);
  }

  update(id: string, dto: UpdatePermissionDto) {
    return this.permissionsRepository.update(id, dto);
  }
}
