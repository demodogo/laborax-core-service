# Async Runtime and Diagnostics

## Processes

### API

Responsibilities:

- receive requests
- validate auth and scope
- persist domain changes
- write outbox rows

### Jobs

Responsibilities:

- publish pending outbox events
- retry failed publications
- recover stuck processing rows

## Startup checks

At boot, the service should make visible:

- database connectivity
- RabbitMQ connectivity when publisher is enabled
- outbox publisher enabled or disabled

## Diagnostic sequence

When an integration issue is reported:

1. verify the business row exists in source tables
2. verify the outbox row exists
3. verify the outbox status
4. verify the jobs process is running
5. verify RabbitMQ exchange/bindings
6. verify downstream consumer behavior

## Internal operational endpoints

- `GET /outbox/internal/events`
- `GET /outbox/internal/stats`
- `POST /outbox/internal/dispatch-once`
- `POST /outbox/internal/requeue-failed`
- `POST /outbox/internal/recover-processing`
