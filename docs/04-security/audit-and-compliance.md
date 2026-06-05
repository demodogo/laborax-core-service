# Auditoría y Cumplimiento

## Requerimientos de Auditoría

- Eventos de autenticación relevantes.
- Cambios administrativos de autorización.
- Cambios administrativos de tenants, companies, contratos, usuarios, roles, permissions y memberships.
- Cambios sobre service clients internos.
- Actualizaciones maestras de workers y vehicles en servicios dueños del dominio.
- Decisiones de acreditación.
- Decisiones y overrides de acceso.
- Observaciones de cumplimiento y generación de reportes.
- Emisión de certificados.
- Acciones sobre casos Karin.

## Campos Mínimos del Registro de Auditoría

- Actor id.
- Actor type.
- Action.
- Target entity.
- Target id.
- Timestamp.
- Correlation id.
- Scope context cuando aplique.
- HTTP method.
- HTTP path.
- IP address.
- User agent.

## Correlation Id

Toda request debe tener un `x-correlation-id`.

- Si el cliente envía `x-correlation-id`, el servicio lo conserva.
- Si el cliente no lo envía, el servicio genera uno.
- La respuesta siempre debe incluir `x-correlation-id`.
- Los logs operacionales deben registrar `correlationId`, método, path, status code y duración.
- Los audit logs deben incluir `correlationId` dentro de `metadata`.

## Restricción de Seguridad

Los logs y audit logs no deben persistir access tokens, refresh tokens, client secrets, passwords ni cuerpos completos de requests con datos sensibles.
