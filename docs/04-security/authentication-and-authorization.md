# Autenticacion y Autorizacion

## Modelo de Autenticacion

- Los usuarios humanos se autentican mediante `platform-core-service`.
- Los servicios internos se autentican mediante credenciales M2M.
- El frontend web se autentica a traves de integracion entre `portal-bff` y auth de plataforma.

## Modelo de Autorizacion

- La autorizacion se centraliza logicamente en `platform-core-service`.
- Los servicios de negocio aplican permissions usando identidad validada y claims acotados.
- Los dominios sensibles pueden agregar politicas locales por encima del RBAC compartido.

## Estrategia de Tokens

- Access tokens de vida corta.
- Refresh tokens asociados a una sesion persistida en `auth.sessions`.
- Rotacion de refresh token en cada `POST /auth/refresh`.
- Revocacion de sesion mediante `POST /auth/logout`.
- Revocacion total de sesiones activas mediante `POST /auth/logout-all`.
- Limite configurable de sesiones activas por usuario mediante `AUTH_MAX_ACTIVE_SESSIONS_PER_USER`.
- Credenciales de servicio para flujos backend M2M.

## Sesiones Interactivas

- Cada login crea una sesion con `refreshTokenHash`, metadata de IP, user agent, expiracion y estado de revocacion.
- El refresh token nunca se guarda en texto plano.
- `lastUsedAt` registra el ultimo uso exitoso de la sesion.
- `revokedReason` permite distinguir cierres voluntarios, cierres administrativos y revocaciones defensivas.
- `reuseDetectedAt` registra intentos de reuse de un refresh token rotado en una sesion activa.
- Al superar el maximo de sesiones activas, el sistema revoca las sesiones mas antiguas del usuario.
- Si un refresh token viejo vuelve a aparecer en una sesion activa, el sistema lo trata como señal de compromiso y revoca las sesiones activas del usuario.
- El logout debe considerarse idempotente: el cliente puede limpiar estado local aunque el refresh token este vencido, malformado o previamente revocado.
- La revocacion de access tokens no se resuelve mediante blacklist en esta etapa; el control se basa en access tokens de vida corta y revocacion de refresh/session.

## Service Clients

- Los servicios internos se autentican con `x-client-id` y `x-client-secret`.
- El secreto se genera de forma criptograficamente segura cuando no se entrega explicitamente.
- El secreto solo se devuelve al crear o rotar; en base de datos se guardan solo hashes.
- El uso exitoso actualiza `lastUsedAt` tanto a nivel de `service client` como del secreto usado.
- Un `service client` puede estar `ACTIVE`, `DISABLED` o `REVOKED`.
- La rotacion de secreto crea un nuevo secreto primario y mantiene el anterior activo solo durante una ventana de gracia configurable mediante `SERVICE_CLIENT_SECRET_GRACE_PERIOD_MINUTES`.
- El modelo persistente utiliza `auth.service_client_secrets` para versionado, trazabilidad y transicion sin downtime.

## Cambios que Requieren Migracion

- `sessions.last_used_at`
- `sessions.reuse_detected_at`
- `sessions.revoked_reason`
