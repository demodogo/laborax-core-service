# core-service

Servicio base del ecosistema Laborax. Este repo nuevo reemplaza el runtime
anterior fragmentado y concentra el core en dos entrypoints:

- `api`: HTTP, auth, RBAC, tenants, companies, contracts comerciales y auditoria
- `jobs`: publicacion de outbox y futuros procesos internos del core

## Alcance

Este servicio es responsable de:

- identidad y autenticacion humana
- autenticacion M2M mediante service clients
- RBAC y scope efectivo
- tenants
- companies
- customer contracts
- users
- memberships
- auditoria transversal
- escritura de eventos en `platform.outbox_events`

## Arquitectura Operativa

El repo ya no depende de un publisher separado. El mismo servicio expone dos
procesos:

- `npm run start:api`
- `npm run start:jobs`

El proceso `api` no publica eventos.
El proceso `jobs` ejecuta el publisher de outbox cuando
`OUTBOX_PUBLISHER_ENABLED=true`.

## Variables Relevantes

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SWAGGER_ENABLED`
- `OUTBOX_PUBLISHER_ENABLED`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `SEED_WORKFORCE_REGISTRY_CLIENT_ID`
- `SEED_WORKFORCE_REGISTRY_CLIENT_SECRET`
- `SEED_WORKFORCE_CONTRACTS_CLIENT_ID`
- `SEED_WORKFORCE_CONTRACTS_CLIENT_SECRET`
- `SEED_ACCESS_CONTROL_CLIENT_ID`
- `SEED_ACCESS_CONTROL_CLIENT_SECRET`
- `SEED_ACCREDITATION_CLIENT_ID`
- `SEED_ACCREDITATION_CLIENT_SECRET`

## Comandos

```bash
npm run build
npm run start:api
npm run start:jobs
```

Para desarrollo:

```bash
npm run start:api:dev
npm run start:jobs:dev
```

## Referencias Internas Para Proyecciones

El servicio expone superficies internas para consumidores y reconciliadores:

- `GET /tenants/internal-reference/:id`
- `GET /tenants/internal-reference`
- `GET /companies/internal-reference/:id`
- `GET /companies/internal-reference`

Estas superficies estan protegidas por `service clients`.

## Swagger

Con `SWAGGER_ENABLED=true`, la documentacion interactiva queda disponible en:

- `http://localhost:3000/docs`

## Fechas y Timestamps

La convencion temporal del ecosistema queda documentada en:

- [temporal-conventions.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/temporal-conventions.md)

Resumen operativo:

- `timestamp with time zone` para instantes tecnicos, serializados en ISO 8601 UTC
- `date` para fechas de negocio, serializadas como `YYYY-MM-DD`
- la conversion horaria visible al usuario corresponde al frontend/BFF

## Runtime Minimo

Para operar el core limpio de esta nueva etapa:

- `core-service api`
- `core-service jobs`
- RabbitMQ
- PostgreSQL

## Diagnostico

La guia operativa y de diagnostico vive en:

- [async-runtime-and-diagnostics.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/06-operations/async-runtime-and-diagnostics.md)
