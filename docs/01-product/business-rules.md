# Reglas de Negocio

- `BR-001`: `tenant` y `company` son gestionados exclusivamente por `platform-core-service`.
- `BR-002`: `worker` y `vehicle` son gestionados exclusivamente por `workforce-registry-service`.
- `BR-003`: `access-control-service` no podrá actuar como fuente de verdad para identidad de trabajador o vehículo.
- `BR-004`: El estado de acreditación será determinado exclusivamente por `accreditation-service`.
- `BR-005`: La elegibilidad de acceso podrá depender del estado de acreditación, pero el ownership de la decisión de acceso pertenece a `access-control-service`.
- `BR-006`: Un servicio que use snapshots locales de datos maestros ajenos deberá tratarlos como copias derivadas.
- `BR-007`: Los datos sensibles de casos Karin sólo podrán ser accesibles mediante roles explícitamente autorizados.
- `BR-008`: Los certificados sólo podrán emitirse desde workflows de certificación completados.
- `BR-009`: Las observaciones de cumplimiento deberán preservar historial auditable inmutable.
- `BR-010`: Todo workflow crítico deberá preservar quién ejecutó la acción, cuándo y bajo qué contexto de autorización.

