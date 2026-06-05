# Topología de Despliegue

## Unidades de Runtime

| Unidad | Tipo |
| --- | --- |
| `platform-core-api` | Servicio HTTP |
| `platform-core-outbox-publisher` | Worker background |
| `workforce-registry-api` | Servicio HTTP |
| `workforce-registry-outbox-publisher` | Worker background |
| `access-control-api` | Servicio HTTP |
| `access-control-event-consumer` | Worker background |
| `access-control-reconciler` | Worker programado |
| `accreditation-api` | Servicio HTTP |
| `accreditation-outbox-publisher` | Worker background |
| `accreditation-alert-scheduler` | Worker programado |
| `accreditation-reconciler` | Worker programado |
| `contractor-compliance-api` | Servicio HTTP |
| `contractor-compliance-scheduler` | Worker programado |
| `contractor-compliance-reconciler` | Worker programado |
| `portal-bff` | Servicio HTTP |
| `notification-service` | Worker o API según implementación |
| `document-storage-service` | API o servicio |

