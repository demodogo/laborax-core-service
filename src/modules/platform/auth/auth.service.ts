import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SERVICE_NAME } from '../../../common/constants/service.constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { IntrospectTokenDto } from './dto/introspect-token.dto';
import { AuthRepository } from './repositories/auth.repository';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import type { AuthUserContext } from './types/auth-user-context.type';
import type { ServiceClientContext } from './types/service-client-context.type';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { LoginResponse } from './types/login-response.type';
import { AccessScopeService } from './services/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly accessScopeService: AccessScopeService,
    private readonly auditService: AuditService,
  ) {}

  getHealth() {
    return {
      service: SERVICE_NAME,
      module: 'auth',
      status: 'ok',
    };
  }

  async login(
    dto: LoginDto,
    metadata: {
      ipAddress?: string | null;
      userAgent?: string | null;
      correlationId?: string | null;
    },
  ): Promise<LoginResponse> {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase());

    if (!user) {
      await this.recordSecurityEvent({
        action: 'auth.login.failed',
        resourceType: 'auth_session',
        metadata: {
          email: dto.email.toLowerCase(),
          reason: 'USER_NOT_FOUND',
        },
        requestMetadata: metadata,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVATED') {
      await this.recordSecurityEvent({
        actorUserId: user.id,
        action: 'auth.login.failed',
        resourceType: 'auth_session',
        resourceId: user.id,
        metadata: {
          email: user.email,
          reason: 'USER_NOT_ACTIVE',
        },
        requestMetadata: metadata,
      });
      throw new UnauthorizedException('User is not active');
    }

    const isValidPassword = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      await this.recordSecurityEvent({
        actorUserId: user.id,
        action: 'auth.login.failed',
        resourceType: 'auth_session',
        resourceId: user.id,
        metadata: {
          email: user.email,
          reason: 'INVALID_PASSWORD',
        },
        requestMetadata: metadata,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessTokenPayload = this.buildAccessTokenPayload(user.id, user.email, user.type);
    const accessToken = await this.tokenService.signAccessToken(accessTokenPayload);

    const provisionalRefreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: 'pending',
      tokenType: 'refresh',
      tokenId: randomUUID(),
    });

    const session = await this.authRepository.createSession({
      userId: user.id,
      refreshTokenHash: this.hashRefreshToken(provisionalRefreshToken),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      expiresAt: this.resolveRefreshExpirationDate(),
    });

    const refreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      tokenType: 'refresh',
      tokenId: randomUUID(),
    });

    await this.authRepository.updateSessionRefreshToken(
      session.id,
      this.hashRefreshToken(refreshToken),
      this.resolveRefreshExpirationDate(),
    );
    await this.authRepository.revokeOldestActiveSessionsForUser(
      user.id,
      session.id,
      this.resolveMaxActiveSessionsPerUser(),
    );
    await this.recordSecurityEvent({
      actorUserId: user.id,
      action: 'auth.login.succeeded',
      resourceType: 'auth_session',
      resourceId: session.id,
      metadata: {
        email: user.email,
      },
      requestMetadata: metadata,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type,
        status: user.status,
      },
    };
  }

  async refresh(
    dto: RefreshTokenDto,
    metadata?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      correlationId?: string | null;
    },
  ): Promise<LoginResponse> {
    let payload: AuthUserContext;

    try {
      payload = await this.jwtService.verifyAsync<AuthUserContext>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.authRepository.findSessionById(payload.sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session not active');
    }

    const isMatchingToken = await this.isMatchingRefreshToken(
      dto.refreshToken,
      session.refreshTokenHash,
    );

    if (!isMatchingToken) {
      await this.authRepository.markSessionRefreshReuseDetected(session.id);
      await this.authRepository.revokeAllActiveSessionsForUser(
        session.userId,
        'REFRESH_TOKEN_REUSE_DETECTED',
      );
      await this.recordSecurityEvent({
        actorUserId: session.userId,
        action: 'auth.refresh.reuse_detected',
        resourceType: 'auth_session',
        resourceId: session.id,
        metadata: {
          reason: 'REFRESH_TOKEN_REUSE_DETECTED',
        },
        requestMetadata: metadata,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVATED') {
      throw new UnauthorizedException('User is not active');
    }

    const accessToken = await this.tokenService.signAccessToken(
      this.buildAccessTokenPayload(user.id, user.email, user.type),
    );
    const refreshToken = await this.tokenService.signRefreshToken({
      sub: user.id,
      sessionId: session.id,
      tokenType: 'refresh',
      tokenId: randomUUID(),
    });

    await this.authRepository.updateSessionRefreshToken(
      session.id,
      this.hashRefreshToken(refreshToken),
      this.resolveRefreshExpirationDate(),
    );
    await this.recordSecurityEvent({
      actorUserId: user.id,
      action: 'auth.refresh.succeeded',
      resourceType: 'auth_session',
      resourceId: session.id,
      metadata: {
        email: user.email,
      },
      requestMetadata: metadata,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type,
        status: user.status,
      },
    };
  }

  async logout(
    dto: RefreshTokenDto,
    metadata?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      correlationId?: string | null;
    },
  ): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<AuthUserContext>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (payload.sessionId) {
        await this.authRepository.revokeSession(payload.sessionId, 'USER_LOGOUT');
        await this.recordSecurityEvent({
          actorUserId: payload.sub,
          action: 'auth.logout.succeeded',
          resourceType: 'auth_session',
          resourceId: payload.sessionId,
          requestMetadata: metadata,
        });
      }
    } catch {
      // Logout is intentionally idempotent: clients can clear local state even
      // when the refresh token is already expired, malformed or revoked.
    }
  }

  async logoutAll(
    user: AuthUserContext,
    metadata?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      correlationId?: string | null;
    },
  ): Promise<void> {
    await this.authRepository.revokeAllActiveSessionsForUser(user.sub, 'USER_LOGOUT_ALL');
    await this.recordSecurityEvent({
      actorUserId: user.sub,
      action: 'auth.logout_all.succeeded',
      resourceType: 'auth_session',
      resourceId: user.sub,
      requestMetadata: metadata,
    });
  }

  async me(user: AuthUserContext) {
    const dbUser = await this.authRepository.findUserById(user.sub);

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      type: dbUser.type,
      status: dbUser.status,
    };
  }

  async meContext(user: AuthUserContext) {
    await this.me(user);
    const [context, accessScope] = await Promise.all([
      this.authRepository.getUserContext(user.sub),
      this.accessScopeService.resolve(user),
    ]);

    return {
      ...context,
      accessScope,
    };
  }

  async introspect(dto: IntrospectTokenDto, serviceClient: ServiceClientContext) {
    const payload = await this.jwtService.verifyAsync<AuthUserContext>(dto.token, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });

    const user = await this.authRepository.findUserById(payload.sub);

    if (!user || user.status !== 'ACTIVATED') {
      throw new UnauthorizedException('User not active');
    }

    const [context, accessScope] = await Promise.all([
      this.authRepository.getUserContext(user.id),
      this.accessScopeService.resolve(payload),
    ]);

    return {
      active: true,
      serviceClientId: serviceClient.clientId,
      payload,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type,
        status: user.status,
      },
      permissions: context.permissions,
      memberships: context.memberships,
      accessScope,
    };
  }

  private buildAccessTokenPayload(sub: string, email: string, type: string): AuthUserContext {
    return {
      sub,
      email,
      type,
    };
  }

  private resolveRefreshExpirationDate() {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }

  private resolveMaxActiveSessionsPerUser() {
    return this.configService.get<number>('AUTH_MAX_ACTIVE_SESSIONS_PER_USER', 5);
  }

  private hashRefreshToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private async isMatchingRefreshToken(value: string, storedHash: string) {
    const sha256Hash = this.hashRefreshToken(value);
    if (sha256Hash === storedHash) {
      return true;
    }

    return this.passwordService.compare(value, storedHash);
  }

  private async recordSecurityEvent(input: {
    actorUserId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    requestMetadata?: {
      ipAddress?: string | null;
      userAgent?: string | null;
      correlationId?: string | null;
    };
  }) {
    await this.auditService.record({
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorUserId ? 'USER' : 'SYSTEM',
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      ipAddress: input.requestMetadata?.ipAddress ?? undefined,
      userAgent: input.requestMetadata?.userAgent ?? undefined,
      metadata: {
        ...(input.metadata ?? {}),
        correlationId: input.requestMetadata?.correlationId ?? null,
      },
    });
  }
}
