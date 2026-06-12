import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUserContext } from './types/auth-user-context.type';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IntrospectTokenDto } from './dto/introspect-token.dto';
import { VerifyServiceClientDto } from './dto/verify-service-client.dto';
import { InternalServiceClientGuard } from './guards/internal-service-client.guard';
import { CurrentServiceClient } from './decorators/current-service-client.decorator';
import { RequireServiceScopes } from './decorators/require-service-scopes.decorator';
import type { ServiceClientContext } from './types/service-client-context.type';
import type { CorrelatedRequest } from '../../../common/observability/correlation-id.middleware';

type AuthHttpRequest = CorrelatedRequest & {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
};

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('health')
  getAuthHealth() {
    return this.authService.getHealth();
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(
    @Body() dto: LoginDto,
    @Req() req: AuthHttpRequest,
  ) {
    return this.authService.login(dto, {
      ipAddress: req.ip ?? null,
      userAgent: this.getHeaderValue(req.headers['user-agent']),
      correlationId: req.correlationId ?? null,
    });
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: AuthHttpRequest) {
    return this.authService.refresh(dto, {
      ipAddress: req.ip ?? null,
      userAgent: this.getHeaderValue(req.headers['user-agent']),
      correlationId: req.correlationId ?? null,
    });
  }

  @Post('logout')
  @HttpCode(204)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Revoca la sesion asociada a un refresh token' })
  @ApiNoContentResponse({ description: 'Sesion revocada o logout idempotente completado' })
  logout(@Body() dto: RefreshTokenDto, @Req() req: AuthHttpRequest) {
    return this.authService.logout(dto, {
      ipAddress: req.ip ?? null,
      userAgent: this.getHeaderValue(req.headers['user-agent']),
      correlationId: req.correlationId ?? null,
    });
  }

  @Post('logout-all')
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoca todas las sesiones activas del usuario autenticado' })
  @ApiNoContentResponse({ description: 'Sesiones activas revocadas' })
  logoutAll(@CurrentUser() user: AuthUserContext, @Req() req: AuthHttpRequest) {
    return this.authService.logoutAll(user, {
      ipAddress: req.ip ?? null,
      userAgent: this.getHeaderValue(req.headers['user-agent']),
      correlationId: req.correlationId ?? null,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AuthUserContext) {
    return this.authService.me(user);
  }

  @Get('me/context')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  meContext(@CurrentUser() user: AuthUserContext) {
    return this.authService.meContext(user);
  }

  @Post('internal/introspect')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('auth:introspect')
  introspect(
    @Body() dto: IntrospectTokenDto,
    @CurrentServiceClient() serviceClient: ServiceClientContext,
  ) {
    return this.authService.introspect(dto, serviceClient);
  }

  @Post('internal/service-clients/verify')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @UseGuards(InternalServiceClientGuard)
  @RequireServiceScopes('auth:introspect')
  verifyServiceClient(@Body() dto: VerifyServiceClientDto) {
    return this.authService.verifyServiceClient(dto);
  }

  private getHeaderValue(value?: string | string[]) {
    if (!value || Array.isArray(value)) {
      return null;
    }

    return value;
  }
}
