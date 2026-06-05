# Casos de Uso

## Actores

- Administrador Interno
- Administrador Cliente
- Auditor
- Operador Contratista
- Guardia de Acceso
- Analista de RRHH
- Analista de Certificación
- Investigador Karin
- Servicio Interno

## Casos de Uso Principales

### UC-001 Autenticar Usuario

- Actor: Cualquier usuario humano autenticado
- Precondición: La cuenta de usuario existe
- Resultado: Sesión autenticada con permisos acotados

### UC-002 Crear Trabajador

- Actor: Administrador Cliente u operador autorizado
- Servicio: `workforce-registry-service`
- Resultado: Se crea un registro canónico de trabajador

### UC-003 Enviar Documentos de Acreditación

- Actor: Operador Contratista
- Servicio: `accreditation-service`
- Resultado: Se envían documentos y se inicia flujo de revisión

### UC-004 Revisar Acreditación

- Actor: Auditor
- Servicio: `accreditation-service`
- Resultado: Se registra decisión de aprobación o rechazo

### UC-005 Ejecutar Decisión de Acceso

- Actor: Guardia de Acceso o integración con dispositivo
- Servicio: `access-control-service`
- Resultado: Se concede o deniega acceso y se registra evento

### UC-006 Abrir Período Mensual de Cumplimiento

- Actor: Administrador Interno
- Servicio: `contractor-compliance-service`
- Resultado: Se crea ciclo de cumplimiento para el alcance objetivo

### UC-007 Emitir Certificado

- Actor: Analista de Certificación
- Servicio: `certification-service`
- Resultado: Se emite certificado y se traza su ciclo de vida

### UC-008 Registrar Denuncia Karin

- Actor: Denunciante o investigador interno
- Servicio: `karin-case-service`
- Resultado: Se abre caso con controles de confidencialidad

