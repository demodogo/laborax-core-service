# Entornos y Release

## Entornos

- `local`
- `dev`
- `staging`
- `production`

## Principios de Release

- Pipeline de despliegue independiente por servicio
- Los cambios de schema son ownership del equipo del servicio
- Evolución backward-compatible de eventos cuando sea posible
- Los cambios a producción requieren pasos de migración, rollback y smoke validation

