# Gestión de Secrets

## Política

- Los secrets no se almacenarán en source control.
- Cada entorno gestionará secrets mediante un secret store centralizado.
- Las credenciales entre servicios deberán rotarse periódicamente.

## Categorías de Secrets

- Secrets de firma JWT o referencias a keys
- Credenciales M2M
- Credenciales de base de datos
- Credenciales de broker
- Credenciales de object storage
- Credenciales del proveedor de correo

## Reglas Operacionales

- Los secrets de producción requerirán flujo auditado de actualización.
- Los servicios deberán leer secrets al iniciar mediante inyección segura de entorno.
- Deberán existir procedimientos de rotación para todas las credenciales críticas.

