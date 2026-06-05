# Contratos de Eventos

## Event Envelope

- `eventId`
- `eventType`
- `aggregateType`
- `aggregateId`
- `aggregateVersion`
- `occurredAt`
- `producer`
- `payload`
- `correlationId` cuando este disponible

## Familias de Eventos Requeridas

### Plataforma

- `tenant.created`
- `tenant.updated`
- `company.created`
- `company.updated`
- `customer_contract.created`
- `customer_contract.updated`
- `service_client.created`
- `service_client.updated`
- `service_client.secret_rotated`

### Workforce

- `worker.created`
- `worker.updated`
- `worker.assignment.created`
- `vehicle.created`

### Acreditacion

- `worker.accreditation.approved`
- `worker.accreditation.expired`
- `vehicle.accreditation.approved`

### Acceso

- `access.granted`
- `access.denied`
- `access.session.closed`

## Outbox y Reconciliacion

Cada servicio dueno de datos debe publicar eventos mediante transactional outbox local.

Flujo minimo:

- La transaccion de negocio persiste el cambio y registra un evento `PENDING`.
- El publisher reclama eventos pendientes y los publica en RabbitMQ.
- Si la publicacion es exitosa, el evento pasa a `PROCESSED`.
- Si falla, el evento pasa a `FAILED` o queda disponible para retry segun intentos.
- Los eventos `PROCESSING` antiguos deben recuperarse mediante reconciliador.

`PROCESSED` significa "publicado correctamente en RabbitMQ". No significa "procesado por un consumidor final".

## Endpoints Operacionales de Platform Core

- `GET /outbox/internal/events`
- `GET /outbox/internal/stats`
- `POST /outbox/internal/dispatch-once`
- `POST /outbox/internal/requeue-failed`
- `POST /outbox/internal/recover-processing`

Estos endpoints son internos y requieren service client con scopes:

- `outbox:read`
- `outbox:dispatch`
- `outbox:retry`

## Regla de Consumidores

Los consumidores deben ser idempotentes por `eventId`. Ningun consumidor debe asumir entrega exactamente una vez. La garantia operacional esperada es at-least-once con reconciliacion.
