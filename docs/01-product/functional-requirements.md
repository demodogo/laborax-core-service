# Requerimientos Funcionales

## RF por Servicio

## 1. `platform-core-service`

- `FR-PC-001`: El sistema deberá autenticar usuarios mediante login centralizado.
- `FR-PC-002`: El sistema deberá gestionar tenants, companies y jerarquía contractual.
- `FR-PC-003`: El sistema deberá gestionar usuarios, memberships, roles y permissions.
- `FR-PC-004`: El sistema deberá exponer autenticación machine-to-machine para servicios internos.
- `FR-PC-005`: El sistema deberá publicar eventos de dominio organizacional.

## 2. `workforce-registry-service`

- `FR-WF-001`: El sistema deberá gestionar registros maestros de trabajadores.
- `FR-WF-002`: El sistema deberá gestionar registros maestros de vehículos.
- `FR-WF-003`: El sistema deberá gestionar asignaciones trabajador-company.
- `FR-WF-004`: El sistema deberá exponer datos canónicos de workforce a consumidores internos.
- `FR-WF-005`: El sistema deberá publicar eventos de ciclo de vida de trabajadores y vehículos.

## 3. `accreditation-service`

- `FR-ACR-001`: El sistema deberá definir requisitos documentales por mandante, company, sitio y tipo de sujeto.
- `FR-ACR-002`: El sistema deberá permitir envío de documentos para trabajadores y vehículos.
- `FR-ACR-003`: El sistema deberá soportar flujos de revisión, aprobación y rechazo.
- `FR-ACR-004`: El sistema deberá calcular estado de acreditación y vencimientos.
- `FR-ACR-005`: El sistema deberá emitir cambios de estado de acreditación.

## 4. `access-control-service`

- `FR-ACS-001`: El sistema deberá gestionar locations, checkpoints y devices.
- `FR-ACS-002`: El sistema deberá gestionar credenciales físicas o lógicas.
- `FR-ACS-003`: El sistema deberá evaluar decisiones de acceso en tiempo cercano a real.
- `FR-ACS-004`: El sistema deberá registrar access events y access sessions.
- `FR-ACS-005`: El sistema deberá bloquear accesos según acreditación o reglas operacionales.

## 5. `contractor-compliance-service`

- `FR-CC-001`: El sistema deberá gestionar evaluaciones periódicas de cumplimiento por contratista.
- `FR-CC-002`: El sistema deberá registrar observaciones y seguimiento de remediación.
- `FR-CC-003`: El sistema deberá generar reportes ejecutivos.
- `FR-CC-004`: El sistema deberá generar alertas por incumplimiento y plazos.
- `FR-CC-005`: El sistema deberá preservar historial auditable de las revisiones.

## 6. `certification-service`

- `FR-CERT-001`: El sistema deberá iniciar casos de certificación.
- `FR-CERT-002`: El sistema deberá gestionar workflows de certificación por etapas.
- `FR-CERT-003`: El sistema deberá validar checklists y evidencia de certificación.
- `FR-CERT-004`: El sistema deberá emitir certificados digitales.
- `FR-CERT-005`: El sistema deberá seguir renovaciones y vencimientos.

## 7. `people-hr-service`

- `FR-HR-001`: El sistema deberá gestionar perfiles laborales extendidos.
- `FR-HR-002`: El sistema deberá gestionar asignación de beneficios.
- `FR-HR-003`: El sistema deberá gestionar historial de capacitación y cursos.
- `FR-HR-004`: El sistema deberá mantener cargos y estructura organizacional.
- `FR-HR-005`: El sistema deberá exportar datos de workforce para auditorías y reporting.

## 8. `karin-case-service`

- `FR-KAR-001`: El sistema deberá recepcionar denuncias confidenciales.
- `FR-KAR-002`: El sistema deberá gestionar investigaciones y responsables.
- `FR-KAR-003`: El sistema deberá controlar plazos legales.
- `FR-KAR-004`: El sistema deberá almacenar actos administrativos y evidencia.
- `FR-KAR-005`: El sistema deberá gestionar el cierre formal de casos.

