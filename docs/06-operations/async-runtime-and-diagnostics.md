# Async Runtime And Diagnostics

## Runtime Minimo

Para desarrollo y smoke real de `core-service`:

- `core-service api`
- `core-service jobs`
- PostgreSQL
- RabbitMQ

## Process Split

- `api`: expone HTTP, auth, RBAC y APIs de negocio
- `jobs`: publica outbox y alojara procesos internos auxiliares del core

## Variables Criticas

- `OUTBOX_PUBLISHER_ENABLED`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `SEED_INTERNAL_JOBS_CLIENT_ID`
- `SEED_INTERNAL_JOBS_CLIENT_SECRET`
- `SEED_WORKFORCE_SERVICE_CLIENT_ID`
- `SEED_WORKFORCE_SERVICE_CLIENT_SECRET`

## Checklist Basico

1. `GET /health` responde `ok`
2. `GET /health/ready` responde `ready`
3. `POST /auth/login` funciona
4. `POST /internal-customers` crea tenant, owner company y contrato comercial
5. `platform.outbox_events` pasa de `PENDING` a `PROCESSED`

## Diagnostico Rapido

- Si la API funciona pero el outbox queda en `PENDING`, el proceso `jobs` no
  esta corriendo o `OUTBOX_PUBLISHER_ENABLED=false`.
- Si `jobs` corre pero no publica, revisar conectividad a RabbitMQ y exchange.
- Si falla introspeccion interna de otros servicios, revisar `service clients`
  y sus scopes en core.
