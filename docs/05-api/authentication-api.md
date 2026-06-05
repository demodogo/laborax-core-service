# API de Autenticacion

## Endpoints de Autenticacion Humana

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/me`
- `GET /auth/me/context`

## `POST /auth/refresh`

Entrega un nuevo `accessToken` y un nuevo `refreshToken`.

Reglas relevantes:

- El refresh token se rota en cada uso exitoso.
- Si un refresh token viejo reaparece en una sesion activa, el sistema lo trata como `refresh token reuse`.
- Ante `refresh token reuse`, se revocan las sesiones activas del usuario.

## `POST /auth/logout`

Revoca la sesion asociada al refresh token informado.

Request:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Respuesta esperada:

- `204 No Content`

El endpoint es idempotente frente a refresh tokens vencidos, invalidos o previamente revocados.

## `POST /auth/logout-all`

Revoca todas las sesiones activas del usuario autenticado.

Requisitos:

- Header `Authorization: Bearer <access-token>`

Respuesta esperada:

- `204 No Content`

## `GET /auth/me/context`

Entrega el contrato principal para BFF y frontend:

- user id
- permissions efectivos
- memberships activos
- roles asociados
- access scope efectivo
- tenants y companies visibles segun scope

## Endpoints de Autenticacion Interna

- `POST /auth/internal/introspect`

## Service Clients M2M

Los `service clients` usan:

- `x-client-id`
- `x-client-secret`
- `x-correlation-id`

Los secretos M2M son versionados en `auth.service_client_secrets`:

- create entrega el secreto inicial una sola vez
- rotate entrega un nuevo secreto una sola vez
- el secreto anterior puede seguir activo temporalmente durante una ventana de gracia

## Requisitos de Response

- Access token.
- Refresh token cuando corresponda.
- Resumen de scope y permissions.
- Contexto tenant/company cuando aplique.
- `x-correlation-id` en headers de respuesta para trazabilidad.
