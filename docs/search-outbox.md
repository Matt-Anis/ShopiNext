**Search outbox and synchronization state**

Phase 3 adds schema definitions and trigger SQL source, now recorded in migrations
0030 and 0031. Database objects exist only after the user applies those migrations.
Phase 4 adds processing, lease renewal, retries, reconciliation, and local cron
under `packages/search-tooling` and `docker/search`. No runtime synchronization
code belongs in `packages/db`.

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
create scheduled-run records. Avoid running them alongside the worker.

**Trigger sources and dependencies**

The source files under `packages/db-tooling/sql/search` are not generated
migrations and are not executed by application imports or ordinary checks.
Combine them in filename order for one custom migration, after the table
migration. SQL is necessary here because Drizzle's table definitions do not
describe PostgreSQL trigger functions, trigger installation, or database roles.
Application and worker queries continue to use the query builder.

| Source | Purpose |
| --- | --- |
| `00-roles.sql` | Define database roles, restrict operational tables, and grant source reads |
| `10-enqueue.sql` | Transactional, coalescing enqueue operation that preserves in-flight work |
| `20-entity-triggers.sql` | Product, order, customer, and staff inserts, deletes, and indexed-field updates |
| `30-product-dependencies.sql` | Images, variant SKUs/visibility, and product-category associations |
| `40-category-dependencies.sql` | Category documents and affected product documents, including cascading deletion |
| `50-function-permissions.sql` | Assign restricted ownership and remove direct execution permissions |

Updates use both an indexed-column list and a null-safe old/new value comparison.
Changing only a non-indexed field, or assigning an indexed field its existing
value, does not enqueue work. Inserts and deletes always enqueue the entity.
Primary-key changes enqueue old and new identifiers so an old search document
can be removed. Repeated dependency events can increment a version more than
once in a transaction; it is a change fence, not an event counter.

| Source change | Pending entity refresh |
| --- | --- |
| Product name, slug, description, publication/trash state, or `minPrice` | Product, affecting public and admin documents |
| Image insertion/deletion, URL, ordering, ID, or owning product | Old and new owning products |
| Variant insertion/deletion, SKU, visibility, or owning product | Old and new owning products |
| Variant price or stock | Existing minimum-price trigger updates products; a changed `minPrice` enqueues the product |
| Category insertion, slug, or description | Category |
| Category name, trash state, or ID | Category and associated products |
| Category deletion | Category and products captured before associations cascade away |
| Product-category association insertion/deletion/change | Old and new owning products |
| Order preview fields or ID | Order, including archive/unarchive |
| Client account name, email, avatar, or ID | Customer |
| Admin account name, email, avatar, role, ban state, or ID | Staff |

The category delete trigger runs before the delete and returns the original row,
so it can find associations before the foreign-key cascade removes them. Normal
entity and child-table triggers run after row changes. Every enqueue participates
in the writer's transaction: an enqueue failure fails the write, and rolling back
the write rolls back its queued changes. There are no HTTP calls, external jobs,
or exception handlers that silently swallow enqueue failures.

`TRUNCATE`, disabled triggers, and maintenance that bypasses normal row writes
are outside this capture path. Existing rows are not automatically backfilled
when triggers are installed. Initial indexing and the later daily reconciliation
remain necessary; this is why the outbox is not the only recovery mechanism.

**Database permissions**

These PostgreSQL roles are independent of Better Auth's owner/manager/staff/demo
roles and of Meilisearch API keys:

| Database role | Permissions |
| --- | --- |
| `search_outbox_writer` | Non-login trigger owner; can read/insert/update the outbox and read product-category IDs for fan-out |
| `search_worker` | Login for synchronization; reads indexed sources and can read/write the three operational tables |

Trigger functions use `SECURITY DEFINER`, a fixed `pg_catalog, pg_temp` search
path, and explicitly qualified tables/functions. They belong to the non-login
role rather than retaining superuser ownership. The migration removes default
public execution and direct execution by app/worker roles. Applications only
perform their existing row writes; the client receives no admin-schema usage or
operational-table permissions. Existing default grants to `admin_app` are
explicitly revoked on these three tables as well.

The worker has table-level reads on catalog tables because Drizzle 0.45's nested
relational queries can generate internal `SELECT *` subqueries. Order, customer,
and staff queries are flat, so their grants are restricted to indexed columns.
No account credentials, sessions, verification tables, carts, or order notes are
granted. Document mappers still explicitly allowlist fields, even where the
database permits a broader catalog read. Neither role can create/alter/drop
business tables; neither app role can enqueue through a directly callable helper.

**User-run migration checkpoint**

The source is prepared for the project's PostgreSQL 16 and Drizzle Kit 0.31
workflow. Migration installation uses the migration superuser described in
`database.md`; application credentials cannot install these objects.

The initial table migration `0030_sparkling_pet_avengers.sql` and custom migration
`0031_search_outbox_triggers.sql` are already committed. Do not regenerate or edit
them. The six SQL source files preserve how the custom migration was prepared;
do not run their sections independently or refill the committed migration.
Future DDL changes require a new user-generated migration.

Apply only the reviewed, pending migrations to the intended local database:

```sh
pnpm db:migrate
```

Set the `search_worker` login password out of band, never in a committed migration:

```sql
ALTER ROLE search_worker WITH PASSWORD '<local-password>';
```

Point `.env.search.local`'s `SEARCH_DATABASE_URL` at that login. The Phase 2
population command continues enforcing a read-only connection; the Phase 4 worker
connection writes operational state. Trigger installation does not start
processing. Use `pnpm search:sync`, `pnpm search:reconcile`, or explicitly start
the local scheduler as described in [search.md](./search.md).

PostgreSQL cannot see Next.js's `NODE_ENV`. Applying the trigger migration installs
capture on whichever database is targeted, including a hosted database if chosen.
The local-only checkpoint should target the local database; the production UI
guard does not disable database triggers. No hosted worker or scheduling is added.

`pnpm check` verifies TypeScript definitions, not SQL execution. Transaction
rollback, no-op updates, relationship moves, cascading deletes, and role boundaries
still need database verification after the user installs the migrations. No
migration generation/application, database connection, or SQL execution is performed
by this phase's implementation or verification commands.

See [local setup and recovery](./search-operations.md) for the final command
sequence, credential handoff, scheduler configuration, and validation limits.

**References**

- [Search architecture and local indexing](./search.md)
- [Database roles and minimum-price trigger](./database.md)
- [PostgreSQL trigger timing and update behavior](https://www.postgresql.org/docs/16/sql-createtrigger.html)
- [Security-definer ownership, search paths, and execution grants](https://www.postgresql.org/docs/16/sql-createfunction.html)
- [Drizzle custom migrations](https://orm.drizzle.team/docs/drizzle-kit-generate)
