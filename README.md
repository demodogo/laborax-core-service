# core-service

Servicio canónico de plataforma de Laborax.

## Responsabilidades

`core-service` es dueño de:

- autenticación humana
- autenticación servicio a servicio
- roles y permisos
- resolución de alcance efectivo
- tenants
- companies
- customer contracts
- users y memberships
- auditoría de plataforma
- publicación del outbox de plataforma

## Modelo de runtime

Este repositorio expone dos entrypoints:

- `api`
- `jobs`

El proceso API maneja tráfico HTTP y escribe registros en outbox.
El proceso jobs publica eventos pendientes y ejecuta procesos de fondo.

## Comandos

```bash
npm run build
npm run start:api
npm run start:jobs
npm run start:all:dev
```

## Áreas principales de API

- `auth`
- `internal-customers`
- `tenants`
- `companies`
- `customer-contracts`
- `users`
- `memberships`
- `roles`
- `permissions`
- `service-clients`
- `outbox/internal`
- `health`

## Superficies internas de integración

Endpoints internos protegidos usados por servicios downstream:

- `POST /auth/internal/introspect`
- `GET /tenants/internal-reference/:id`
- `GET /tenants/internal-reference`
- `GET /companies/internal-reference/:id`
- `GET /companies/internal-reference`

## Variables de entorno importantes

- `DATABASE_URL`
- `PORT`
- `SWAGGER_ENABLED`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `OUTBOX_PUBLISHER_ENABLED`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`

Los seeds de `service clients` usados por servicios downstream también se
configuran aquí.

## Documentación local

- [docs/README.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/README.md)
- [docs/temporal-conventions.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/temporal-conventions.md)
- [docs/06-operations/async-runtime-and-diagnostics.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/06-operations/async-runtime-and-diagnostics.md)

## Swagger

Con `SWAGGER_ENABLED=true`:

- `http://localhost:3000/docs`
