# Laborax Documentation Set

## Purpose

This documentation set defines the product, architecture, data, security, API
and runtime baseline for Laborax V2.

## Core Sections

- [Architecture Base](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/laborax-ecosystem-architecture.md)
- [01 Product](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/01-product/vision-and-scope.md)
- [02 Architecture](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/02-architecture/system-context.md)
- [03 Data](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/03-data/conceptual-data-model.md)
- [04 Security](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/04-security/authentication-and-authorization.md)
- [05 API](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/05-api/api-standards.md)
- [06 Operations](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/06-operations/operating-model.md)
- [06 Async Runtime And Diagnostics](C:/Users/demodogo/Documents/LaboraxV2/platform-core-service/docs/06-operations/async-runtime-and-diagnostics.md)

## Main Decision

Laborax is being rebuilt as a platform of bounded contexts with explicit data
ownership, business APIs and separate auxiliary processes.

## Business Services

- `platform-core-service`
- `workforce-registry-service`
- `access-control-service`
- `accreditation-service`
- `contractor-compliance-service`
- `karin-case-service`
- `certification-service`
- `people-hr-service`

## Shared Services

- `portal-bff`
- `notification-service`
- `document-storage-service`

## Auxiliary Processes

- `outbox-publisher`
- `event-consumer`
- `reference-sync`
- `reconciler`
- `scheduler`
