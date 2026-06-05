import { Injectable } from '@nestjs/common';
import { OutboxService } from '../outbox/outbox.service';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserCredentialsDto } from './dto/update-user-credentials.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly outboxService: OutboxService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async findAll(currentUser: AuthUserContext, query: GetUsersQueryDto) {
    const scope = await this.accessScopeService.resolve(currentUser);
    return this.usersRepository.findAll(query, scope);
  }

  async findOne(currentUser: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(currentUser);
    return this.usersRepository.findOne(id, scope);
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersRepository.create(dto, passwordHash);

    await this.outboxService.publish({
      aggregateType: 'user',
      aggregateId: user.id,
      eventType: 'user.created',
      payload: user,
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.update(id, dto);

    await this.outboxService.publish({
      aggregateType: 'user',
      aggregateId: user.id,
      eventType: 'user.updated',
      payload: user,
    });

    return user;
  }

  async updateCredentials(id: string, dto: UpdateUserCredentialsDto) {
    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.usersRepository.updateCredentials(id, dto, passwordHash);

    await this.outboxService.publish({
      aggregateType: 'user',
      aggregateId: user.id,
      eventType: 'user.credentials_updated',
      payload: user,
    });

    return user;
  }

  async getContext(currentUser: AuthUserContext, id: string) {
    const scope = await this.accessScopeService.resolve(currentUser);
    await this.usersRepository.findOne(id, scope);
    return this.usersRepository.getContext(id);
  }
}
