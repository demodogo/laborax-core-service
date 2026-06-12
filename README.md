# core-service

Servicio canonico de plataforma de Laborax.

## Responsabilidades

`core-service` es dueno de:

- autenticacion humana
- autenticacion servicio a servicio
- roles y permisos
- resolucion de alcance efectivo
- tenants
- companies
- customer contracts
- users y memberships
- auditoria de plataforma
- publicacion del outbox de plataforma

## Modelo de runtime

Este repositorio expone dos entrypoints:

- `api`
- `jobs`

El proceso API maneja trafico HTTP y escribe registros en outbox.
El proceso jobs publica eventos pendientes y ejecuta procesos de fondo.

## Comandos

```bash
npm run build
npm run start:api
npm run start:jobs
npm run start:all:dev
```

## Areas principales de API

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

## Superficies internas de integracion

Endpoints internos protegidos usados por servicios downstream:

- `POST /auth/internal/introspect`
- `POST /auth/internal/service-clients/verify`
- `GET /tenants/internal-reference/:id`
- `GET /tenants/internal-reference`
- `GET /companies/internal-reference/:id`
- `GET /companies/internal-reference`

## Contrato interno de auth y service clients

`core-service` es la autoridad de autenticacion interna de la suite.

Contrato actual:

- los servicios internos se autentican con `x-client-id` y `x-client-secret`
- `POST /auth/internal/introspect` exige scope `auth:introspect`
- `POST /auth/internal/service-clients/verify` exige scope `auth:introspect`
- los endpoints `internal-reference` de tenants y companies usan el mismo esquema de credenciales internas

Respuesta base de `introspect`:

- `active`
- `serviceClientId`
- `payload`
- `user`
- `permissions`
- `memberships`
- `accessScope`

`accessScope` es el contrato estable para downstream:

- `isGlobal`
- `tenantIds`
- `companyIds`
- `companyPaths`

Scopes internos actualmente seedados:

- `auth:introspect`
- `platform:read`
- `platform:jobs`
- `outbox:read`
- `outbox:dispatch`
- `outbox:retry`
- `workforce:internal_reference.read`

Service clients seedados actualmente:

- `portal-bff`
- `internal-jobs`
- `workforce-service`
- `access-control-service`

## Baseline de IDs, scopes y estados

Convenciones base ya cerradas:

- `tenantId`, `companyId`, `userId`, `roleId`, `membershipId` y `serviceClientId` son `uuid`
- roles usan scope `GLOBAL`, `TENANT` o `COMPANY`
- el subtree de company se representa por `companyPaths`
- un scope `COMPANY` accede a su nodo y a sus descendientes

## Contrato de errores HTTP

Los errores HTTP expuestos por el servicio responden con envelope uniforme:

- `statusCode`
- `error`
- `message`
- `timestamp`
- `path`
- `correlationId`

## Variables de entorno importantes

- `DATABASE_URL`
- `PORT`
- `SWAGGER_ENABLED`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `OUTBOX_PUBLISHER_ENABLED`
- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`

Los seeds de `service clients` usados por servicios downstream tambien se
configuran aqui.

## Documentacion local

- [docs/README.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/README.md)
- [docs/temporal-conventions.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/temporal-conventions.md)
- [docs/06-operations/async-runtime-and-diagnostics.md](C:/Users/demodogo/Documents/LaboraxV2/services/core-service/docs/06-operations/async-runtime-and-diagnostics.md)

## Swagger

Con `SWAGGER_ENABLED=true`:

- `http://localhost:3000/docs`
