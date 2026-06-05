# Modelo de Datos Físico

## Principios Físicos

- Una base de datos o boundary de schema por servicio desplegado independientemente
- Sin foreign keys cross-service
- Referencias a maestros externos almacenadas como IDs externos o IDs de proyección local
- Event store u outbox persistido localmente por servicio

## Patrón de Persistencia

| Servicio | Patrón de Persistencia |
| --- | --- |
| `platform-core-service` | Base relacional OLTP + tabla outbox |
| `workforce-registry-service` | Base relacional OLTP + tabla outbox |
| `accreditation-service` | Base relacional OLTP + tabla outbox + metadata documental |
| `access-control-service` | Base relacional OLTP + tablas de proyección local |
| `contractor-compliance-service` | Base relacional OLTP + tablas resumen orientadas a reporting |

