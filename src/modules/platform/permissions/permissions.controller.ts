import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { GetPermissionsQueryDto } from './dto/get-permissions-query.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Permissions')
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('platform.permissions.read')
  @ApiOperation({ summary: 'Lista permissions' })
  findAll(@Query() query: GetPermissionsQueryDto) {
    return this.permissionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('platform.permissions.read')
  @ApiOperation({ summary: 'Obtiene un permission' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Post()
  @RequirePermissions('platform.permissions.create')
  @ApiOperation({ summary: 'Crea un permission' })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('platform.permissions.update')
  @ApiOperation({ summary: 'Actualiza un permission' })
  update(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.permissionsService.update(id, dto);
  }
}
