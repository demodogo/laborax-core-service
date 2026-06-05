# Propuesta de Arquitectura del Ecosistema Laborax

Fecha: 2026-06-02

## 1. Propósito

El presente documento establece una propuesta formal de arquitectura para el ecosistema Laborax, considerando:

- el estado actual del proyecto ubicado en `C:\Users\demodogo\Documents\projects\eaa\laborax`
- la necesidad de evolucionar hacia una plataforma multiproducto
- la conveniencia de corregir tempranamente límites de dominio y ownership de datos
- la necesidad de habilitar desarrollo incremental sin introducir acoplamientos estructurales

## 2. Alcance

La propuesta cubre los siguientes productos o líneas funcionales del ecosistema:

- `Laborax SCC`: control de contratistas
- `Laborax SCA`: control de acceso
- `Acreditax`: acreditación de trabajadores y vehículos
- `Certificax`: certificación laboral digital
- `Gestionax`: gestión de recursos humanos
- `SmartKarin`: gestión de casos bajo Ley Karin

El documento define:

- límites de dominio
- ownership de datos
- capacidades de plataforma compartidas
- criterio de partición lógica
- criterio de despliegue
- estrategia de transición desde el estado actual

## 3. Base de Análisis

El análisis se fundamenta en:

- la estructura actual de `laborax-core`
- la estructura actual de `laborax-ac`
- los módulos visibles en `laborax-webapp`
- la descripción funcional observada en las capturas del ecosistema

Se verificó en código que el estado actual contiene, entre otros elementos:

- `laborax-core` como servicio central de identidad, tenants, companies, contratos y permisos base
- `laborax-ac` como servicio operacional de control de acceso
- ownership actual de `workers`, `vehicles`, `worker_company_assignments`, `worker_documents` y capacidades relacionadas dentro de `laborax-ac`

## 4. Diagnóstico del Estado Actual

### 4.1. Fortalezas actuales

La base actual presenta decisiones correctas y reutilizables:

- separación física entre `core` y `ac`
- base de autenticación y autorización centralizada
- modelado de tenants, companies y contratos en `core`
- patrón `transactional outbox` para publicación de eventos
- separación entre procesos API y worker en `core`

Estas decisiones son compatibles con una arquitectura evolutiva por dominios.

### 4.2. Desalineación principal de dominio

La principal desalineación identificada es que `laborax-ac` no sólo resuelve el dominio de control de acceso, sino que además actúa como autoridad de negocio para entidades que tienen carácter transversal en el ecosistema:

- trabajadores
- vehículos
- asignaciones trabajador-empresa
- parte del onboarding
- parte del ciclo documental operacional

Esta situación genera una superposición de responsabilidades entre:

- control de acceso
- registro maestro de personas
- registro maestro de vehículos
- acreditación documental
- habilitación operacional

### 4.3. Riesgos arquitectónicos de mantener el diseño actual

Si el estado actual se mantiene, los riesgos más probables son:

1. Duplicación de la entidad `worker` en múltiples productos.
2. Duplicación de la entidad `vehicle` en múltiples productos.
3. Dependencia de módulos futuros respecto de un servicio cuyo dominio principal no es maestro de personas.
4. Crecimiento de permisos, endpoints y modelos `ac:*` para conceptos que no pertenecen al dominio de acceso.
5. Mayor complejidad de migración cuando `Gestionax`, `Acreditax` o `SCC` requieran ownership propio de reglas y procesos.
6. Inconsistencia semántica entre persona, trabajador, operador, acreditado y sujeto habilitado.

## 5. Principios de Arquitectura

La arquitectura propuesta se rige por los siguientes principios:

### 5.1. Separación entre dato maestro y dato operacional

Las entidades canónicas compartidas por varios productos deben tener un único owner de negocio. Los servicios consumidores podrán mantener snapshots, read models o proyecciones locales, pero no asumirán ownership semántico de dichas entidades.

### 5.2. Bounded contexts explícitos

La plataforma debe estructurarse a partir de bounded contexts, no a partir de pantallas ni de menús. Cada contexto debe tener:

- responsabilidades claramente delimitadas
- ownership explícito sobre sus entidades y reglas
- contratos de integración definidos

### 5.3. Despliegue incremental

La partición lógica de dominios no obliga, en una primera etapa, a desplegar un microservicio por cada bounded context. La implementación puede evolucionar por fases, manteniendo la separación lógica desde el inicio.

### 5.4. Integración por eventos y APIs

La integración entre contextos debe combinar:

- APIs síncronas para consulta o comando puntual
- eventos de dominio para sincronización y desacoplamiento
- proyecciones locales para operación eficiente

### 5.5. Base transversal compartida

Autenticación, autorización, identidad de plataforma, catálogos transversales, storage documental y auditoría no deben reimplementarse producto por producto.

## 6. Arquitectura Lógica Objetivo

## 6.1. Aclaración sobre la partición de dominios

La partición de dominios definida en este documento corresponde, en primer término, a una partición lógica y semántica del negocio.

No implica automáticamente un microservicio independiente por dominio.

Cada dominio definido a continuación debe entenderse como un bounded context. Su forma de despliegue podrá adoptar una de las siguientes variantes, según la fase del programa:

- módulo interno dentro de un backend mayor
- servicio desplegable independiente
- servicio independiente con base de datos propia

La decisión de despliegue debe tomarse por criticidad, acoplamiento, carga operativa, madurez del equipo y necesidad de escalamiento independiente.

## 6.2. Contextos de dominio

### A. `platform-core`

Responsabilidades:

- identidad de plataforma
- autenticación
- autorización base
- usuarios internos y clientes
- tenants
- companies
- relaciones contractuales
- service clients
- catálogo de módulos habilitados
- auditoría transversal
- publicación de eventos base de organización

Entidades principales:

- `user`
- `role`
- `permission`
- `membership`
- `tenant`
- `company`
- `customerContract`
- `serviceClient`

### B. `workforce-registry`

Responsabilidades:

- registro maestro de trabajadores
- registro maestro de vehículos
- asignaciones trabajador-empresa
- asignaciones vehículo-empresa si aplica
- atributos base compartidos de identidad laboral y operacional

Entidades principales:

- `worker`
- `vehicle`
- `workerCompanyAssignment`
- `vehicleCompanyAssignment`

Este contexto debe asumir el ownership canónico de trabajadores y vehículos.

### C. `accreditation-compliance`

Responsabilidades:

- definición de requisitos documentales
- ciclo de carga, revisión y aprobación documental
- vigencias
- alertas de vencimiento
- trazabilidad de acreditación
- estados de cumplimiento documental por sujeto

Entidades principales:

- `requirementDefinition`
- `submittedDocument`
- `documentReview`
- `accreditationStatus`
- `expirationAlert`

Este contexto representa el núcleo funcional de `Acreditax`.

### D. `access-control`

Responsabilidades:

- ubicaciones
- checkpoints
- dispositivos
- credenciales físicas o lógicas
- sesiones de acceso
- eventos de acceso
- decisión operacional de ingreso o salida
- políticas de habilitación operacional

Entidades principales:

- `location`
- `checkpoint`
- `device`
- `accessCredential`
- `accessSession`
- `accessEvent`

Este contexto puede mantener snapshots de `worker`, `vehicle` y `accreditationStatus`, pero no debe ser owner de dichas entidades.

### E. `contractor-compliance`

Responsabilidades:

- monitoreo mensual laboral y previsional
- observaciones
- incumplimientos
- reportes ejecutivos
- trazabilidad de auditorías
- alertas regulatorias y contractuales

Entidades principales:

- `compliancePeriod`
- `observation`
- `auditRecord`
- `executiveReport`
- `complianceAlert`

Este contexto representa el núcleo funcional de `SCC`.

### F. `certification`

Responsabilidades:

- proceso de certificación
- workflow por etapas
- diagnóstico inicial
- checklist de certificación
- emisión de certificados
- renovación

Entidades principales:

- `certificationCase`
- `certificationStage`
- `certificationChecklist`
- `issuedCertificate`

Este contexto representa el núcleo funcional de `Certificax`.

### G. `people-hr`

Responsabilidades:

- ficha ampliada de trabajador
- beneficios
- capacitaciones
- cursos
- cargos
- estructura organizacional

Entidades principales:

- `employeeProfile`
- `benefitAssignment`
- `trainingRecord`
- `position`
- `orgUnit`

Este contexto representa el núcleo funcional de `Gestionax`.

### H. `case-management-karin`

Responsabilidades:

- recepción de denuncias
- gestión de casos
- investigación
- actos administrativos
- control de plazos legales
- cierre formal

Entidades principales:

- `karinCase`
- `complaint`
- `investigation`
- `deadline`
- `administrativeAct`

Este contexto representa el núcleo funcional de `SmartKarin`.

## 7. Ownership de Datos

| Entidad | Owner propuesto | Consumidores habituales |
| --- | --- | --- |
| `user` | `platform-core` | todos |
| `tenant` | `platform-core` | todos |
| `company` | `platform-core` | todos |
| `customerContract` | `platform-core` | SCC, reporting, portal |
| `worker` | `workforce-registry` | AC, Acreditax, Gestionax, SCC, Certificax |
| `vehicle` | `workforce-registry` | AC, Acreditax |
| `workerCompanyAssignment` | `workforce-registry` | AC, Acreditax, SCC |
| `requirementDefinition` | `accreditation-compliance` | AC, SCC, Certificax |
| `submittedDocument` | `accreditation-compliance` | SCC, Certificax, auditoría |
| `accreditationStatus` | `accreditation-compliance` | AC, SCC |
| `accessCredential` | `access-control` | AC |
| `accessSession` | `access-control` | AC, reporting |
| `accessEvent` | `access-control` | SCC, analytics |
| `observation` | `contractor-compliance` | SCC |
| `issuedCertificate` | `certification` | SCC, portal cliente |
| `trainingRecord` | `people-hr` | Gestionax |
| `karinCase` | `case-management-karin` | SmartKarin |

## 8. Implicancias para el Estado Actual de `laborax-ac`

La arquitectura objetivo implica una redefinición del alcance de `laborax-ac`.

### 8.1. Capacidades que deben permanecer en `access-control`

- locations
- checkpoints
- devices
- credentials
- access sessions
- access events
- motor de decisión de acceso

### 8.2. Capacidades que deben salir de `access-control` como ownership

- `workers`
- `vehicles`
- `worker_company_assignments`
- parte del onboarding documental
- parte del estado documental del sujeto

### 8.3. Interpretación correcta

El hecho de que `access-control` deje de ser owner de `workers` y `vehicles` no implica que no pueda persistir datos derivados localmente.

Sí puede mantener:

- snapshots
- proyecciones
- copias de lectura
- índices operacionales

No debe mantener el CRUD maestro ni la autoridad de negocio sobre esas entidades.

## 9. Modelo de Integración

## 9.1. Interacción recomendada

La plataforma debe combinar tres mecanismos:

1. APIs síncronas para consultas o comandos puntuales.
2. Eventos de dominio para propagación de cambios.
3. Read models locales por contexto para operación resiliente.

## 9.2. Eventos mínimos transversales

### Desde `platform-core`

- `tenant.upserted`
- `tenant.deleted`
- `company.upserted`
- `company.deleted`
- `contract.updated`

### Desde `workforce-registry`

- `worker.created`
- `worker.updated`
- `worker.deactivated`
- `worker.assignment.created`
- `worker.assignment.updated`
- `vehicle.created`
- `vehicle.updated`

### Desde `accreditation-compliance`

- `worker.accreditation.approved`
- `worker.accreditation.rejected`
- `worker.accreditation.expired`
- `vehicle.accreditation.approved`
- `requirement.definition.changed`

### Desde `access-control`

- `access.granted`
- `access.denied`
- `access.session.opened`
- `access.session.closed`

### Desde `certification`

- `certificate.issued`
- `certificate.expired`

### Desde `case-management-karin`

- `karin.case.opened`
- `karin.case.updated`

## 9.3. Infraestructura de integración

Para la etapa actual del programa, la infraestructura mínima sugerida es:

- una base de datos por servicio desplegado independientemente
- patrón outbox por contexto que emita eventos
- broker de mensajería de complejidad moderada
- object storage común para documentos

La adopción inmediata de infraestructura de alta complejidad no es requisito para materializar esta arquitectura. La prioridad es la correcta delimitación de ownership y contratos.

## 10. Criterio de Despliegue

## 10.1. Respuesta formal a la pregunta sobre microservicios

La partición planteada en el punto 6.2 no debe interpretarse como obligación inmediata de construir ocho microservicios independientes.

Debe interpretarse como una estructura de bounded contexts.

La recomendación formal de despliegue es la siguiente:

### Etapa 1. Servicios independientes estrictamente necesarios

Desplegar separadamente:

- `platform-core`
- `workforce-registry`
- `access-control`

### Etapa 2. Contextos inicialmente agrupables

Pueden comenzar como módulos internos dentro de un mismo backend de negocio, siempre que conserven separación lógica y contratos explícitos:

- `accreditation-compliance`
- `contractor-compliance`
- `certification`
- `people-hr`
- `case-management-karin`

### Etapa 3. Extracción por necesidad

Cada uno de los contextos agrupados podrá separarse físicamente cuando ocurra alguno de los siguientes supuestos:

- crecimiento relevante de complejidad propia
- necesidad de despliegue independiente
- variación fuerte de escalamiento
- requisitos regulatorios o de segregación
- autonomía de equipo

## 10.2. Razonamiento

Un diseño correcto no exige microservicios prematuros, pero sí exige límites correctos desde el inicio.

El error más costoso no es partir con menos servicios físicos. El error más costoso es partir con ownership equivocado del dato.

## 11. Decisión de Separación Física de Servicios

La arquitectura objetivo sí requiere separación física entre ciertos contextos. No todos los bounded contexts deben desplegarse como microservicios desde el día uno, pero tampoco conviene resolver todo en un único backend.

La decisión propuesta es la siguiente.

## 11.1. Microservicios obligatorios

Estos servicios deben existir como unidades de despliegue independientes desde el inicio.

### A. `platform-core-service`

Motivo de separación:

- concentra identidad, autenticación y autorización
- es dependencia transversal de todos los demás módulos
- requiere ciclo de despliegue estable y altamente controlado
- expone capacidades internas M2M y publica eventos organizacionales

Procesos:

- `platform-core-api`
- `platform-core-outbox-publisher`

No requiere reconciliador propio si es la fuente maestra del dato organizacional.

### B. `workforce-registry-service`

Motivo de separación:

- será la autoridad de `worker`, `vehicle` y asignaciones
- es consumido por acceso, acreditación, RRHH y cumplimiento
- requiere independencia clara respecto de control de acceso

Procesos:

- `workforce-registry-api`
- `workforce-registry-outbox-publisher`

Procesos auxiliares recomendados:

- `workforce-registry-readmodel-projector` si se opta por proyecciones internas desacopladas

### C. `access-control-service`

Motivo de separación:

- tiene operación en tiempo real
- tiene reglas operacionales y eventos de acceso
- puede requerir latencias, escalamiento y disponibilidad distintas
- se integra con hardware, lectores, QR, checkpoints y sesiones

Procesos:

- `access-control-api`
- `access-control-event-consumer`
- `access-control-reconciler`

El reconciliador en este servicio sí es obligatorio, porque `access-control` depende de snapshots provenientes de otras fuentes maestras y no puede confiar exclusivamente en entrega perfecta de eventos.

## 11.2. Servicios de negocio recomendados como independientes

Estos contextos deberían modelarse como servicios separados desde el inicio si el objetivo es una plataforma verdaderamente multiproducto y no un backend temporal único.

### D. `accreditation-service`

Cobertura:

- `Acreditax`
- reglas documentales de habilitación
- carga, revisión, aprobación y vencimientos

Motivo de separación:

- tiene workflow documental propio
- concentra estados de acreditación consumidos por `access-control` y `SCC`
- tendrá alto volumen de archivos, revisiones y alertas

Procesos:

- `accreditation-api`
- `accreditation-outbox-publisher`
- `accreditation-alert-scheduler`
- `accreditation-reconciler`

El reconciliador se recomienda porque este servicio dependerá de snapshots de `tenant`, `company`, `worker` y `vehicle`.

### E. `contractor-compliance-service`

Cobertura:

- `Laborax SCC`

Motivo de separación:

- responde a lógica distinta de acceso y acreditación
- concentra observaciones, auditorías, cierres mensuales, reportes y alertas ejecutivas
- puede evolucionar con reglas regulatorias propias

Procesos:

- `contractor-compliance-api`
- `contractor-compliance-outbox-publisher`
- `contractor-compliance-scheduler`
- `contractor-compliance-reconciler`

El reconciliador es recomendable porque depende de información derivada desde `platform-core`, `workforce-registry`, `accreditation-service` y eventualmente `certification-service`.

### F. `karin-case-service`

Cobertura:

- `SmartKarin`

Motivo de separación:

- maneja datos sensibles
- requiere segregación fuerte por confidencialidad y acceso
- posee procesos legales y temporales propios

Procesos:

- `karin-case-api`
- `karin-case-outbox-publisher`
- `karin-case-deadline-scheduler`

En este caso el reconciliador no es obligatorio si el servicio sólo consume referencias maestras mínimas y mantiene sus propios procesos internos.

## 11.3. Servicios que pueden iniciar agrupados pero con límites explícitos

Estos dominios pueden partir en un mismo backend físico siempre que se mantengan módulos separados y contratos internos claros.

### G. `certification-service`

Puede iniciar:

- como microservicio independiente, si desde el inicio la certificación tendrá operación comercial propia
- o agrupado con `accreditation-service`, si comparten buena parte del ciclo documental y del equipo operativo

Decisión recomendada:

- iniciar agrupado lógicamente bajo el mismo repositorio/backend que acreditación
- separar físicamente solo si la certificación adquiere workflow, SLA o volumen propios

### H. `people-hr-service`

Puede iniciar:

- como servicio propio si `Gestionax` es un producto comercial prioritario desde el inicio
- o como módulo agrupado si su primera versión sólo extiende atributos del trabajador, beneficios y capacitaciones

Decisión recomendada:

- no mezclarlo con `workforce-registry`
- si se agrupa físicamente al inicio, debe agruparse como backend aparte y no dentro del servicio maestro de workforce

## 11.4. Servicios transversales de plataforma

Además de los servicios de negocio, la arquitectura requiere capacidades técnicas compartidas.

### A. `notification-service`

Responsabilidad:

- emails
- recordatorios
- alertas
- mensajería operativa

No debe contener lógica de negocio principal; sólo orquestación de envíos.

### B. `document-storage-service`

Responsabilidad:

- emisión de URLs seguras
- control de acceso a archivos
- metadatos técnicos de almacenamiento

La lógica documental de negocio sigue perteneciendo a `accreditation-service` o `certification-service`.

### C. `portal-bff`

Responsabilidad:

- punto de entrada del frontend
- composición de respuestas
- control de sesión web
- desacople entre frontend y malla de microservicios

El portal no debe llamar al conjunto completo de servicios de negocio directamente desde el navegador.

## 11.5. Sincronizadores, consumidores y reconciliadores

La arquitectura propuesta sí debe considerar explícitamente procesos no HTTP.

### Tipos de procesos requeridos

1. `outbox-publisher`
   Publica eventos persistidos por el servicio owner.

2. `event-consumer`
   Consume eventos de otros servicios y actualiza snapshots o read models.

3. `reconciler`
   Repara desalineaciones entre fuente maestra y copia local.

4. `scheduler`
   Ejecuta tareas calendarizadas, vencimientos, alertas y cierres periódicos.

### Dónde son obligatorios

| Servicio | Outbox publisher | Event consumer | Reconciler | Scheduler |
| --- | --- | --- | --- | --- |
| `platform-core-service` | Sí | No | No | Opcional |
| `workforce-registry-service` | Sí | Sí | Recomendado | Opcional |
| `access-control-service` | Sí si emite eventos propios | Sí | Sí | Opcional |
| `accreditation-service` | Sí | Sí | Sí | Sí |
| `contractor-compliance-service` | Sí | Sí | Sí | Sí |
| `certification-service` | Sí | Sí | Recomendado | Sí |
| `people-hr-service` | Sí | Sí | Recomendado | Sí |
| `karin-case-service` | Sí | Sí | Opcional | Sí |

### Criterio formal

Todo servicio que no sea owner del dato maestro pero dependa operacionalmente de una copia local debe contar con:

- consumidor de eventos
- reconciliador

El reconciliador no es un accesorio. En una arquitectura distribuida es un mecanismo de consistencia operativa.

## 11.6. Topología recomendada

La topología inicial recomendada para Laborax es:

- `platform-core-service`
- `workforce-registry-service`
- `access-control-service`
- `accreditation-service`
- `contractor-compliance-service`
- `karin-case-service`
- `certification-service` agrupable con acreditación en primera etapa
- `people-hr-service` agrupable en primera etapa, pero no dentro de workforce
- `portal-bff`
- `notification-service`
- `document-storage-service`

Esto produce una plataforma con:

- entre 6 y 8 servicios de negocio reales
- 2 a 3 servicios transversales
- múltiples procesos auxiliares por servicio

No es una arquitectura mínima, pero sí es coherente con el alcance multiproducto descrito.

## 12. Decisiones Arquitectónicas Propuestas

Se proponen formalmente las siguientes decisiones:

1. `worker` deja de pertenecer al dominio de `access-control`.
2. `vehicle` deja de pertenecer al dominio de `access-control`.
3. `access-control` conserva únicamente proyecciones locales de sujetos y su elegibilidad operacional.
4. `Acreditax` asume ownership sobre requisitos, revisión documental y vigencias.
5. `Gestionax` consume la identidad base del trabajador desde `workforce-registry`.
6. `SCC` consume estados documentales y de acreditación; no debe redefinirlos.
7. `Certificax` mantiene bounded context propio si su flujo regulatorio y operativo lo justifica; de lo contrario, puede iniciar como módulo dentro de un backend compartido con `accreditation-compliance`.

## 13. Conclusión

La arquitectura actual contiene una base técnicamente aprovechable, pero presenta una desalineación relevante en el ownership de entidades transversales.

La corrección principal consiste en separar:

- plataforma
- registro maestro de workforce
- acreditación documental
- operación de acceso

La partición lógica propuesta no obliga a una adopción inmediata de un microservicio por dominio. Sí obliga, en cambio, a definir correctamente los bounded contexts y el ownership del dato desde el inicio.

En consecuencia, la decisión arquitectónica adecuada para la etapa actual no es una reescritura indiscriminada, sino una reestructuración progresiva con límites formales de dominio, contratos explícitos e implementación incremental.
