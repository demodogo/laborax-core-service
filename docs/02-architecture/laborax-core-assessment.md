# Evaluación Técnica de `laborax-core` Frente a la Arquitectura Objetivo

Fecha: 2026-06-02

## 1. Propósito

Este documento evalúa el proyecto actual `C:\Users\demodogo\Documents\projects\eaa\laborax\laborax-core` frente a la arquitectura objetivo definida para el nuevo ecosistema Laborax.

El objetivo no es validar si el código actual “sirve” en términos de ejecución, sino determinar:

- qué capacidades conceptuales deben preservarse
- qué módulos pueden reutilizarse como referencia de diseño
- qué elementos requieren rediseño obligatorio
- qué elementos no deben existir en el nuevo `platform-core-service`

## 2. Conclusión Ejecutiva

La conclusión es la siguiente:

- `laborax-core` sí contiene una base válida para el nuevo `platform-core-service`
- `laborax-core` no puede trasladarse sin cambios al rediseño
- `laborax-core` requiere rediseño funcional, contractual y de límites de plataforma
- el volumen de cambio esperado en `core` es menor que en `laborax-ac`, pero no es menor en términos arquitectónicos

En términos estrictos, la respuesta es:

`laborax-core` no debe mantenerse intacto.

Debe ser reconstruido como el núcleo de plataforma del ecosistema completo, no como el servicio central de una solución pensada principalmente para `core + ac`.

## 3. Hallazgos Verificados

Del análisis del código actual se verificó lo siguiente:

### 3.1. Capacidades y módulos actuales

El `PlatformModule` actual agrupa, entre otros:

- `auth`
- `users`
- `roles`
- `permissions`
- `memberships`
- `tenants`
- `companies`
- `customer-contracts`
- `internal-customers`
- `internal-organization`
- `audit`
- `outbox`
- `reconciliation-runs`
- `notifications`

### 3.2. Modelo de datos principal actual

El modelo persistente de `laborax-core` contiene, entre otros:

- `users`
- `roles`
- `permissions`
- `memberships`
- `membership_roles`
- `tenants`
- `companies`
- `customer_contracts`
- `service_clients`
- `sessions`
- `audit_logs`
- `outbox_events`
- `reconciliation_runs`

### 3.3. Patrones ya implementados

El servicio actual ya incorpora patrones valiosos:

- autenticación central
- autorización basada en `roles`, `permissions` y `memberships`
- `service_clients` para M2M
- `transactional outbox`
- endpoint interno de snapshot organizacional
- worker de publicación de eventos

### 3.4. Señales de acoplamiento al estado anterior

También se verificó acoplamiento explícito al diseño actual de `Access Control`:

- el `README` de `laborax-core` está redactado alrededor de la integración con `laborax-ac`
- `permissions.seed.ts` define múltiples permisos `ac:*` dentro de Core
- `internal/organization/snapshot` hoy responde a una necesidad concreta de sincronización organizacional
- el modelo de `service_clients` y scopes actuales está orientado a pocos consumidores internos
- existe un módulo `reconciliation-runs` expuesto desde Core para monitorear procesos relacionados a la integración actual

## 4. Clasificación de Capacidades

## 4.1. Capacidades que sobreviven como parte del nuevo `platform-core-service`

Estas capacidades sí pertenecen al nuevo Core y deben mantenerse conceptualmente:

### A. Identidad y autenticación

Incluye:

- login
- refresh
- logout
- sesiones
- validación de identidad
- introspección interna

Estado:

- sobrevive
- requiere rediseño contractual menor

### B. Autorización base

Incluye:

- roles
- permissions
- memberships
- scopes

Estado:

- sobrevive
- requiere rediseño estructural moderado

Motivo:

el modelo actual es correcto en intención, pero deberá ampliarse para cubrir más productos, más contextos sensibles y scopes más variados.

### C. Tenants, companies y contratos

Incluye:

- `tenants`
- `companies`
- `customer_contracts`
- jerarquía organizacional

Estado:

- sobrevive
- requiere rediseño funcional menor a moderado

Motivo:

estas entidades sí pertenecen a plataforma, pero deberán desacoplarse del enfoque actual centrado en el arranque de clientes y su relación con `ac`.

### D. Auditoría transversal

Incluye:

- `audit_logs`
- interceptores o mecanismos equivalentes de auditoría

Estado:

- sobrevive
- requiere fortalecimiento

Motivo:

en la nueva arquitectura la auditoría de plataforma debe ser más transversal y uniforme entre servicios.

### E. M2M y `service_clients`

Incluye:

- `service_clients`
- validación de credenciales internas
- scopes para consumo entre servicios

Estado:

- sobrevive
- requiere rediseño moderado

Motivo:

el modelo actual sirve como base, pero el nuevo ecosistema tendrá más servicios y más contratos internos.

### F. `transactional outbox`

Incluye:

- `outbox_events`
- `outbox-publisher`
- monitoreo de publicación

Estado:

- sobrevive
- requiere generalización

Motivo:

el patrón es correcto, pero los contratos de eventos deben definirse para toda la malla de servicios, no sólo para Core hacia AC.

## 4.2. Capacidades que sobreviven sólo como referencia, no como implementación final directa

Estas capacidades son útiles como referencia conceptual, pero no deberían copiarse tal cual:

### A. `internal-customers`

El módulo actual crea tenant, company, contrato, usuario admin y membership en una misma operación.

Estado:

- útil como referencia
- no debe trasladarse sin revisión

Motivo:

en la nueva plataforma habrá que decidir si el alta comercial y el aprovisionamiento organizacional siguen siendo una sola operación o se separan en workflows distintos.

### B. `internal-organization/snapshot`

Estado:

- útil como referencia
- no debe conservarse exactamente igual

Motivo:

el nuevo Core seguirá exponiendo datos organizacionales a otros servicios, pero la estrategia debe formalizarse como contrato general de plataforma, no como integración puntual con un consumidor.

### C. `access-scope.service`

Estado:

- útil como referencia
- debe rediseñarse

Motivo:

el cálculo de scopes será más complejo al existir más dominios, más tipos de usuarios y módulos con sensibilidad distinta.

## 4.3. Capacidades que deben rediseñarse obligatoriamente

### A. Modelo de permisos

Hallazgo:

`permissions.seed.ts` hoy incluye permisos `core:*` y permisos `ac:*`.

Problema:

Core no debería seguir siendo el lugar donde se “siembran” permisos específicos de un único dominio operativo como si ese dominio fuera el consumidor principal del ecosistema.

Decisión:

- el nuevo Core debe seguir siendo autoridad de autorización
- pero el catálogo de permisos debe reorganizarse por productos y bounded contexts del ecosistema completo

### B. Contratos M2M

Hallazgo:

`service_clients` y `allowedScopes` existen y son correctos como idea base.

Problema:

la forma actual parece pensada para pocos consumidores internos y un set acotado de scopes como `auth:introspect` u `organization:snapshot`.

Decisión:

- mantener el patrón
- rediseñar catálogo de scopes y contratos por servicio

### C. Auditoría

Hallazgo:

Core ya posee módulo de auditoría propio.

Problema:

en el nuevo ecosistema la auditoría no puede ser sólo “lo que Core registra de sus propios endpoints”.

Decisión:

- mantener auditoría de plataforma
- definir modelo transversal de auditoría que los demás servicios también puedan adoptar o publicar

### D. Reconciliación y monitoreo de reconciliación

Hallazgo:

Core contiene `reconciliation-runs`.

Problema:

en la nueva arquitectura, la reconciliación dejará de ser una necesidad casi exclusiva del vínculo con AC y pasará a ser un patrón general distribuido.

Decisión:

- el concepto de reconciliación sobrevive
- el módulo actual no debería seguir expuesto igual dentro de Core como si centralizara todos los runs del ecosistema

### E. Notificaciones

Hallazgo:

existe un módulo `notifications` dentro de `laborax-core`.

Problema:

por su naturaleza, `notifications` es una capacidad transversal separable y no parte esencial del Core de identidad y organización.

Además, el controller actual tiene apariencia de scaffold genérico y no de capacidad madura de plataforma.

Decisión:

- no mantener `notifications` dentro del nuevo Core
- extraerlo como `notification-service` o eliminarlo del alcance del Core

## 4.4. Capacidades que no deben existir en el nuevo Core

### A. Permisos específicos de un dominio operativo acoplados al seed principal

Ejemplos actuales:

- `ac:workers:*`
- `ac:vehicles:*`
- `ac:locations:*`
- `ac:devices:*`
- `ac:access-events:read`

Esto no significa que Core no sea autoridad de permisos.

Significa que el modelo debe reorganizarse formalmente como catálogo de autorización multi-producto, no como seed heredado del primer dominio consumidor.

### B. Monitoreo o reporting pensado exclusivamente para la integración con un único servicio

Ejemplo:

- enfoque actual de `reconciliation-runs`

El nuevo Core no debe modelarse como observatorio especializado de un único flujo `core -> ac`.

### C. Lógica transversal de negocio no perteneciente a plataforma

Ejemplo actual potencial:

- `notifications`

Regla:

si una capacidad no pertenece a identidad, organización, autorización, aprovisionamiento organizacional o gobierno transversal, no debe quedar embebida en `platform-core-service`.

## 5. Evaluación por Módulo Actual

| Módulo actual | Decisión | Observación |
| --- | --- | --- |
| `auth` | Conservar y rediseñar | Pertenece al nuevo Core |
| `users` | Conservar y rediseñar | Pertenece al nuevo Core |
| `roles` | Conservar y rediseñar | Pertenece al nuevo Core |
| `permissions` | Conservar y rediseñar profundamente | Debe pasar a modelo multiproducto |
| `memberships` | Conservar y rediseñar | Debe soportar más scopes y contextos |
| `tenants` | Conservar | Dominio correcto de plataforma |
| `companies` | Conservar | Dominio correcto de plataforma |
| `customer-contracts` | Conservar | Dominio correcto de plataforma |
| `internal-customers` | Rediseñar | Útil como operación de aprovisionamiento, no copiar tal cual |
| `internal-organization` | Conservar conceptualmente y rediseñar | Debe pasar a contrato general de plataforma |
| `audit` | Conservar y fortalecer | Debe alinearse con auditoría transversal |
| `outbox` | Conservar y generalizar | Patrón correcto |
| `reconciliation-runs` | Rediseñar o extraer | El enfoque actual es demasiado específico |
| `notifications` | Extraer o eliminar del Core | No pertenece al núcleo de plataforma |
| `health` | Conservar | Capacidad técnica estándar |

## 6. Evaluación por Modelo de Datos Actual

| Tabla / agregado | Decisión |
| --- | --- |
| `users` | Conservar |
| `roles` | Conservar |
| `permissions` | Conservar con rediseño semántico |
| `memberships` | Conservar con rediseño de scope |
| `membership_roles` | Conservar |
| `tenants` | Conservar |
| `companies` | Conservar |
| `customer_contracts` | Conservar |
| `service_clients` | Conservar con ampliación de contratos |
| `sessions` | Conservar |
| `audit_logs` | Conservar y fortalecer |
| `outbox_events` | Conservar |
| `reconciliation_runs` | Rediseñar o mover |

## 7. Decisión Técnica

La decisión técnica recomendada es:

### 7.1. `laborax-core` no se reutiliza como código base cerrado

No se recomienda tomar el proyecto actual y sólo “ajustarlo”.

Se recomienda reconstruir `platform-core-service` con base en:

- los límites correctos ya identificados
- los patrones correctos ya probados
- los modelos conceptuales reutilizables del código actual

### 7.2. Sí se reutiliza como referencia estructural

Pueden reutilizarse como referencia:

- organización general del dominio de auth
- modelo de roles, permissions y memberships
- modelo de tenants, companies y contratos
- patrón outbox
- service clients
- auditoría

### 7.3. El nuevo `platform-core-service` debe definirse para toda la plataforma

Eso implica que el nuevo Core debe diseñarse desde el inicio para:

- múltiples servicios consumidores
- múltiples catálogos de permisos
- scopes y políticas más ricas
- aprovisionamiento organizacional genérico
- contratos internos de plataforma
- gobierno transversal

## 8. Respuesta Directa

En términos estrictos:

- no, no corresponde dejar `laborax-core` tal como está
- sí, varias de sus capacidades sobreviven
- sí, gran parte de sus conceptos pueden mantenerse
- no, su diseño actual no debe copiarse 1:1

La postura correcta es:

`laborax-core` es una base conceptual válida, pero el nuevo `platform-core-service` debe ser rediseñado como plataforma del ecosistema completo y no como evolución directa del Core actual orientado principalmente a la integración con Access Control.
