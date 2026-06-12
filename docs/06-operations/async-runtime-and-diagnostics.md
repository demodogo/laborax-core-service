# Runtime Async y Diagnóstico

## Procesos

### API

Responsabilidades:

- recibir requests
- validar auth y alcance
- persistir cambios de dominio
- escribir filas en outbox

### Jobs

Responsabilidades:

- publicar eventos pendientes del outbox
- reintentar publicaciones fallidas
- recuperar filas estancadas en processing

## Chequeos al arranque

Al boot, el servicio debería hacer visible:

- conectividad a base de datos
- conectividad a RabbitMQ cuando el publisher esté habilitado
- publisher de outbox habilitado o deshabilitado

## Secuencia de diagnóstico

Ante un problema de integración:

1. verificar que la fila de negocio exista en tablas fuente
2. verificar que la fila de outbox exista
3. verificar el estado de la fila de outbox
4. verificar que el proceso jobs esté corriendo
5. verificar exchange y bindings en RabbitMQ
6. verificar comportamiento del consumer downstream

## Endpoints operacionales internos

- `GET /outbox/internal/events`
- `GET /outbox/internal/stats`
- `POST /outbox/internal/dispatch-once`
- `POST /outbox/internal/requeue-failed`
- `POST /outbox/internal/recover-processing`
