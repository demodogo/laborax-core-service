# core-service

Canonical platform service for Laborax.

## Responsibilities

`core-service` owns:

- human authentication
- service-to-service authentication
- roles and permissions
- effective scope resolution
- tenants
- companies
- customer contracts
- users and memberships
- platform audit
- platform outbox publication

## Runtime model

This repository exposes two entrypoints:

- `api`
- `jobs`

The API process handles HTTP traffic and writes outbox records.
The jobs process publishes pending outbox events and runs background operations.

## Commands

```bash
npm run build
npm run start:api
npm run start:jobs
npm run start:all:dev
```

## Main API areas

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

## Internal integration surfaces

Protected internal endpoints used by downstream services:

- `POST /auth/internal/introspect`
- `GET /tenants/internal-reference/:id`
- `GET /tenants/internal-reference`
- `GET /companies/internal-reference/:id`
- `GET /companies/internal-reference`

## Important environment variables

- `DATABASE_URL`
- `PORT`
- `SWAGGER_ENABLED`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `OUTBOX_PUBLISHER_ENABLED`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`

Service-client seeds used by downstream services are also configured here.

## Local documentation

- [docs/README.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/README.md)
- [docs/temporal-conventions.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/temporal-conventions.md)
- [docs/06-operations/async-runtime-and-diagnostics.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/06-operations/async-runtime-and-diagnostics.md)

## Swagger

When `SWAGGER_ENABLED=true`:

- `http://localhost:3000/docs`
