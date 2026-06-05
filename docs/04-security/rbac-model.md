# Modelo RBAC

## Roles Base

- `platform_admin`
- `internal_compliance_admin`
- `customer_admin`
- `contractor_operator`
- `auditor`
- `access_guard`
- `access_supervisor`
- `certification_analyst`
- `hr_analyst`
- `karin_investigator`

## Dimensiones de Scope

- `GLOBAL`
- `TENANT`
- `COMPANY`
- `SITE`
- Scope específico de caso para módulos confidenciales.

## Regla General

Los permissions se asignan mediante roles y memberships con scope. Los módulos sensibles pueden requerir tanto permission RBAC como validaciones contextuales adicionales.

El sistema distingue entre permission y scope efectivo:

- Permission define la acción permitida, por ejemplo `platform.companies.read`.
- Scope efectivo define sobre qué datos puede ejecutarse esa acción.
- `GLOBAL` permite operar sobre todos los tenants y companies.
- `TENANT` limita visibilidad al tenant asignado.
- `COMPANY` limita visibilidad a la company asignada y su subtree descendente.

## Regla de Subtree

Los usuarios asociados a una company pueden ver información desde su nodo hacia abajo, no hacia arriba. Esto evita que contractors o subcontractors accedan a información amplia de su mandante o tenant.

Cuando la UI requiera contexto superior, por ejemplo el nombre de la mandante o del tenant, ese dato debe exponerse como metadata limitada mediante un read model o respuesta enriquecida. No debe confundirse metadata contextual con permiso de lectura amplio sobre el ancestor.

## Contrato para BFF y Front

`GET /auth/me/context` debe entregar:

- Identidad del usuario.
- Permissions efectivos.
- Memberships activos.
- Roles asociados.
- Scope efectivo calculado.
- Companies visibles dentro del scope.

El BFF puede componer vistas usando esta respuesta, pero no debe transformarse en fuente de verdad de autorización. La autorización debe validarse en el servicio dueño del recurso.
