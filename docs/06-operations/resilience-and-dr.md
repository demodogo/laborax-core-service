# Resiliencia y Disaster Recovery

## Requerimientos de Resiliencia

- Reintentos con idempotencia para procesamiento asíncrono
- Manejo de dead-letter para consumo fallido de eventos
- Reconciliación programada para corrección de datos derivados
- Backup y restore por cada store persistente

## Principios de Disaster Recovery

- Las bases de datos de cada servicio se respaldan independientemente
- Existen procedimientos de recovery documentados por servicio
- Se definen políticas de retención y recovery para object storage

