# Requerimientos No Funcionales

## RNF de Plataforma

- `NFR-001 Disponibilidad`: Los servicios críticos de negocio deberán apuntar al menos a 99.5% de disponibilidad mensual en producción.
- `NFR-002 Auditabilidad`: Todo cambio de estado crítico deberá ser auditable con actor, timestamp y contexto de acción.
- `NFR-003 Seguridad`: Toda llamada entre servicios deberá usar credenciales M2M autenticadas.
- `NFR-004 Aislamiento`: Cada servicio desplegado independientemente deberá ser dueño de su base de datos o schema.
- `NFR-005 Trazabilidad`: Documentos y decisiones de negocio deberán preservar metadatos históricos inmutables.
- `NFR-006 Observabilidad`: Todos los servicios deberán emitir logs estructurados, métricas y trazas.
- `NFR-007 Escalabilidad`: Las decisiones de acceso y los workflows documentales deberán escalar independientemente.
- `NFR-008 Recuperabilidad`: Deberán existir respaldos y procedimientos de restore para todos los stores persistentes.

## RNF Específicos por Servicio

| Servicio | RNF Clave |
| --- | --- |
| `platform-core-service` | Seguridad fuerte, latencia estable de auth, alta consistencia |
| `workforce-registry-service` | Consistencia fuerte de datos maestros, alta trazabilidad |
| `access-control-service` | Baja latencia, alta disponibilidad, read models locales resilientes |
| `accreditation-service` | Trazabilidad de workflow, integridad documental, scheduling de vencimientos |
| `contractor-compliance-service` | Trazabilidad de reportería, resiliencia batch periódica |
| `certification-service` | Trazabilidad legal, integridad del historial de aprobación |
| `people-hr-service` | Privacidad de datos, exportabilidad, historial consistente |
| `karin-case-service` | Confidencialidad, autorización estricta, trail sensible |

