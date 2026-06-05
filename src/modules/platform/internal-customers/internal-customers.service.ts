import { Injectable } from '@nestjs/common';
import { PasswordService } from '../auth/services/password.service';
import { CreateInternalCustomerDto } from './dto/create-internal-customer.dto';
import { InternalCustomersRepository } from './repositories/internal-customers.repository';

@Injectable()
export class InternalCustomersService {
  constructor(
    private readonly internalCustomersRepository: InternalCustomersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreateInternalCustomerDto) {
    const passwordHash = await this.passwordService.hash(dto.adminPassword);
    return this.internalCustomersRepository.create(dto, passwordHash);
  }
}
