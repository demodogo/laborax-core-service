# Async Runtime And Diagnostics

## Objective

This guide defines the operational contract for asynchronous Laborax processes
before `access-control-service` is opened.

Current runtime baseline:

- `platform-core-service`
- `platform-core-outbox-publisher`
- `workforce-registry-service`
- `workforce-registry-outbox-publisher`
- `workforce-core-reference-sync`
- `workforce-core-reference-reconciler`
- `workforce-contracts-service`
- `workforce-contracts-reference-sync`
- RabbitMQ

## Queue And Process Convention

- one durable queue per process and per environment
- one logical consumer per queue unless an explicit consumer group strategy exists
- no orphan local consumers
- queue names must be stable and predictable

Current convention:

- `workforce.core-reference-sync`
- future temporary replay queues must be explicit, for example:
  - `workforce.core-reference-sync.replay.local`

## Source Of Truth And Repair Layers

`workforce-registry-service` resolves organizational references using three
layers:

1. local projections in `integration.core_tenant_projections`
2. synchronous fallback to `platform-core-service`
3. periodic reconciliation through `workforce-core-reference-reconciler`

Normal operation should depend on layer 1.
Layer 2 is contingency only.
Layer 3 is the repair path for missed messages, stale consumers or drift.

## Core Events Consumed By Workforce

The sync contract is intentionally narrow:

- `tenant.created`
- `tenant.updated`
- `company.created`
- `company.updated`

No other event types should mutate `integration.core_*_projections`.

## Worker Boot Health Contract

Standalone workers must verify their critical dependencies before reporting
ready:

- database connectivity
- RabbitMQ connectivity when the worker consumes or publishes messages
- expected exchange and queue/binding existence when applicable
- upstream internal API reachability when the process depends on HTTP pull

Structured ready logs must identify:

- `process`
- `action`
- queue when applicable
- exchange when applicable
- interval or poll cadence when applicable
- dependency readiness flags

## Failure Policy

### Outbox publishers

- claim `PENDING` or `FAILED`
- mark `PROCESSING`
- publish
- mark `PROCESSED` on success
- mark `FAILED` and move `available_at` forward on failure
- recover stale `PROCESSING` records back to `PENDING`

### Sync consumers

- process only supported event contracts
- log structured failure details
- `nack(message, false, false)` on processing failure
- do not block the queue by requeue storms

### Reconciler

- reconcile by paginated pull from `platform-core-service`
- perform idempotent upserts
- update `last_synced_at`
- increment `projection_version` only when relevant content changes

## Manual Replay And Repair Contract

There is no full DLQ/replay subsystem yet.
The supported repair paths are:

1. keep `workforce-core-reference-sync` running on its stable queue
2. if a consumer was down or drift exists, run `workforce-core-reference-reconciler`
3. if a controlled replay is needed, use a dedicated temporary queue name and a
   coordinated replay process

Rebuilding databases is not the operational repair strategy.

## Quick Diagnosis

### API wrote data but consumer side is stale

Check in order:

1. business row exists in source service
2. source outbox event exists
3. outbox status is `PROCESSED`
4. sync worker is running on the expected queue
5. projection row exists or was updated
6. if not, run reconciler and inspect structured logs

### Projection missing but fallback works

Interpretation:

- source API is available
- local projection is stale or absent
- sync or broker path failed earlier
- reconciler should repair the state

### Queue drains but projection does not change

Check:

- sync structured failure logs
- payload contract
- database connectivity
- projection version and `last_synced_at`

### Projection version increases unexpectedly

Check:

- consumer duplicated on the same queue
- reconciler writing real content changes
- payload source timestamps

Content-identical reconciliation should only refresh `last_synced_at`.

## Access Control Prerequisite

`access-control-service` must start from the same pattern:

- `platform-core-service` owns organization and permissions
- `workforce-registry-service` owns workers and vehicles
- `access-control-service` consumes projections and snapshots
- `access-control-service` must not depend on continuous synchronous reads to
  `platform-core-service`

Expected events for the next bounded context:

- `tenant.*`
- `company.*`
- `worker.*`
- `vehicle.*`
- later `accreditation.*`

## Smoke Validation Rule

A green business flow is not enough to approve async health.

Some services still have synchronous fallback paths that can hide a broken sync.
The concrete case already observed was:

- `workforce-registry-service` could complete onboarding
- `workforce-core-reference-sync` was not running
- local `integration.core_company_projections` was incomplete
- fallback HTTP to `platform-core-service` hid the issue

Because of that, smoke approval requires all of these:

1. source business row exists
2. source outbox row exists
3. outbox row is `PROCESSED`
4. sync worker was running on the expected queue
5. target projection row exists
6. downstream service operation succeeds using that projection
7. reconciler is bootable as the repair path
