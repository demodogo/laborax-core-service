import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './services/password.service';
import { AccessScopeService } from './services/access-scope.service';
import { TokenService } from './services/token.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthRepository } from './repositories/auth.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { InternalServiceClientGuard } from './guards/internal-service-client.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    AccessScopeService,
    TokenService,
    JwtAuthGuard,
    InternalServiceClientGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    AuthRepository,
    PasswordService,
    AccessScopeService,
    TokenService,
    JwtModule,
    JwtAuthGuard,
    InternalServiceClientGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
