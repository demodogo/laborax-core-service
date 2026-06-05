import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentServiceClient } from '../auth/decorators/current-service-client.decorator';
import { RequireServiceScopes } from '../auth/decorators/require-service-scopes.decorator';
import { InternalServiceClientGuard } from '../auth/guards/internal-service-client.guard';
import type { ServiceClientContext } from '../auth/types/service-client-context.type';
import { GetOutboxEventsQueryDto } from './dto/get-outbox-events-query.dto';
import { RecoverProcessingQueryDto } from './dto/recover-processing-query.dto';
import { OutboxDispatcherService } from './outbox-dispatcher.service';
import { OutboxService } from './outbox.service';

@Controller('outbox/internal')
@UseGuards(InternalServiceClientGuard)
@ApiTags('Outbox Internal')
@ApiSecurity('x-client-id')
@ApiSecurity('x-client-secret')
export class OutboxController {
  constructor(
    private readonly outboxDispatcherService: OutboxDispatcherService,
    private readonly outboxService: OutboxService,
  ) {}

  @Get('events')
  @RequireServiceScopes('outbox:read')
  @ApiOperation({ summary: 'Lista eventos del outbox para operacion interna' })
  findEvents(@Query() query: GetOutboxEventsQueryDto) {
    return this.outboxService.findAll(query);
  }

  @Get('stats')
  @RequireServiceScopes('outbox:read')
  @ApiOperation({ summary: 'Obtiene estadisticas del outbox' })
  getStats() {
    return this.outboxService.getStats();
  }

  @Post('dispatch-once')
  @RequireServiceScopes('outbox:dispatch')
  @ApiOperation({ summary: 'Ejecuta un ciclo manual de dispatch del outbox' })
  dispatchOnce(@CurrentServiceClient() serviceClient: ServiceClientContext) {
    return this.outboxDispatcherService.dispatchOnce();
  }

  @Post('requeue-failed')
  @RequireServiceScopes('outbox:retry')
  @ApiOperation({ summary: 'Requeue de eventos FAILED' })
  requeueFailed() {
    return this.outboxService.requeueFailed();
  }

  @Post('recover-processing')
  @RequireServiceScopes('outbox:retry')
  @ApiOperation({ summary: 'Recupera eventos PROCESSING estancados' })
  recoverProcessing(@Query() query: RecoverProcessingQueryDto) {
    return this.outboxService.recoverProcessing(query.olderThanSeconds);
  }
}
