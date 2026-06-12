import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '../audit/decorators/audit-action.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserCredentialsDto } from './dto/update-user-credentials.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('platform.users.read')
  @ApiOperation({ summary: 'Lista usuarios visibles segun scope efectivo' })
  findAll(@CurrentUser() user: AuthUserContext, @Query() query: GetUsersQueryDto) {
    return this.usersService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('platform.users.read')
  @ApiOperation({ summary: 'Obtiene un usuario visible segun scope efectivo' })
  findOne(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.usersService.findOne(user, id);
  }

  @Get(':id/context')
  @RequirePermissions('platform.users.read')
  @ApiOperation({ summary: 'Obtiene contexto completo de un usuario' })
  getContext(@CurrentUser() user: AuthUserContext, @Param('id') id: string) {
    return this.usersService.getContext(user, id);
  }

  @Post()
  @RequirePermissions('platform.users.create')
  @ApiOperation({ summary: 'Crea un usuario' })
  @AuditAction({ action: 'platform.users.create', resourceType: 'user' })
  create(@CurrentUser() user: AuthUserContext, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions('platform.users.update')
  @ApiOperation({ summary: 'Actualiza un usuario' })
  @AuditAction({ action: 'platform.users.update', resourceType: 'user', resourceIdParam: 'id' })
  update(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user, id, dto);
  }

  @Patch(':id/credentials')
  @RequirePermissions('platform.users.update_credentials')
  @ApiOperation({ summary: 'Actualiza credenciales de un usuario' })
  @AuditAction({
    action: 'platform.users.update_credentials',
    resourceType: 'user',
    resourceIdParam: 'id',
  })
  updateCredentials(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserCredentialsDto,
  ) {
    return this.usersService.updateCredentials(user, id, dto);
  }
}
