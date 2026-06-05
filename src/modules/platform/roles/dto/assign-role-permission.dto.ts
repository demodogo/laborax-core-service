import { IsUUID } from 'class-validator';

export class AssignRolePermissionDto {
  @IsUUID()
  permissionId!: string;
}
