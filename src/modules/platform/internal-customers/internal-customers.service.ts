import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccessScopeService } from '../auth/services/access-scope.service';
import type { AuthUserContext } from '../auth/types/auth-user-context.type';
import { PasswordService } from '../auth/services/password.service';
import { CreateInternalCustomerDto } from './dto/create-internal-customer.dto';
import { InternalCustomersRepository } from './repositories/internal-customers.repository';

@Injectable()
export class InternalCustomersService {
  constructor(
    private readonly internalCustomersRepository: InternalCustomersRepository,
    private readonly passwordService: PasswordService,
    private readonly accessScopeService: AccessScopeService,
  ) {}

  async create(user: AuthUserContext, dto: CreateInternalCustomerDto) {
    const scope = await this.accessScopeService.resolve(user);
    if (!scope.isGlobal) {
      throw new ForbiddenException('Internal customer onboarding requires global scope');
    }

    const passwordHash = await this.passwordService.hash(dto.adminPassword);
    return this.internalCustomersRepository.create(dto, passwordHash);
  }
}
