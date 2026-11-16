**Search outbox and synchronization state**

Phase 3 adds schema definitions and trigger SQL source. These definitions do not
create database objects until the user generates and applies migrations. The
processing worker, lease renewal, retries, and reconciliation are Phase 4 work.
No runtime synchronization code belongs in `packages/db`.

**Why three tables**

| Table | Purpose |
| --- | --- |
| `admin.search_outbox` | One pending refresh per entity, with version, retry timing, job lease, and asynchronous Meilisearch task references |
| `admin.search_sync_runs` | Operational history for scheduled outbox/reconciliation runs, outcomes, counts, and a concise last error |
| `admin.search_sync_leases` | A single renewable `search-sync` lease shared by outbox processing and reconciliation |

The queue handles product, category, order, customer, and staff entities. Products
and categories can affect both public and admin indexes. The worker decides which
documents currently belong in each index; the queue does not store publication
decisions or historical document payloads.

Entity identifiers are text because catalog/order IDs are UUIDs while auth IDs
are text. There is deliberately no foreign key to the source entity: deleting a
row must leave its pending search removal intact. The unique entity-type/ID pair
coalesces repeated changes without accumulating a complete event history.

**Versions and asynchronous tasks**

Every enqueue increments `version`, resets `attempts` and `lastError`, and makes
the entity immediately eligible through `availableAt`. `createdAt` preserves
the first pending enqueue time; `updatedAt` records the latest enqueue.

An in-flight `taskVersion` identifies the version used to submit `tasks`. Each
reference contains only index UID, task UID, and replace/delete operation. These
references and any existing lease must survive a newer enqueue. For example,
version 4 can arrive while version 3 is indexing; the version-3 completion cannot
delete version 4's pending work. An empty task list with a non-null task version
can represent claimed work whose tasks have not yet been recorded.

The worker must condition acknowledgement on the job ID, owned lease token, and
expected version, after every affected index task succeeds. If the current
version differs, it keeps the newer work pending. Lease release must be scoped
to the owned token and must not overwrite newer retry/error state. A crash after
submission but before recording task IDs can produce a repeated replacement or
deletion; those operations must remain idempotent.

| Event | Required state handling |
| --- | --- |
| Entity changes | Increment version; make work due; preserve active lease/task references |
| Worker claims due work | Obtain a token and expiry without holding a transaction during network calls |
| Worker submits documents | Persist task references and the version they belong to |
| Existing task completes | Acknowledge only the owned, matching version; retain newer changes |
| Task or network operation fails | Retain work, record a concise error, and schedule a retry |
| Worker crashes | Expired leases permit recovery; inspect saved task state before new submissions |

All operational timestamps use PostgreSQL timestamps with time zones. Worker
lease comparisons and renewals should use the database clock. There are no ORM
`$onUpdate` callbacks on these tables: both SQL triggers and worker updates must
write their timestamps explicitly.

**Run history and shared lease**

A run records its kind (`outbox` or `reconcile`), ownership token, start/end,
status, processed/failed jobs, checked/upserted/deleted documents, and last error.
`running` requires no finish time; terminal statuses require one. `interrupted`
lets a later worker identify a run abandoned by a crashed process. Counts are
nonnegative. Do not store document snapshots, credentials, or raw customer data
in run errors.

The single shared lease serializes the two scheduled modes without keeping a
database connection or lock open between 15-minute invocations. Its owner token
must fence renewals/releases so an old process cannot release a newer lease.
Expiry enables recovery; it does not cancel an already submitted Meilisearch
task. Recover saved task references before assuming an old run has stopped.

This is synchronization monitoring, not user search analytics. Recent keywords
stay in browser storage, and search requests do not write these tables. The
manual population/rebuild commands remain read-only on PostgreSQL and do not
create scheduled-run records. Avoid running them alongside the future worker.
