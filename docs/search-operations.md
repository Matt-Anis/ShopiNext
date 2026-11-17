**Local search setup and recovery**

Search is implemented for the local demo. Both hosted apps deliberately disable
it when `NODE_ENV === "production"`, including local production builds. There is
no extra availability flag, cloud scheduler, or hosted search service.

This guide describes the implemented commands. During implementation, only
static checks were run: no test suite, migration, live database query, indexing
command, container startup, image build, or browser validation was performed by
the agent. Commands below are for the developer to run against their local setup.

See [architecture and contracts](./search.md) for visibility, permissions,
alternatives, and diagrams; [outbox design](./search-outbox.md) for capture and
recovery state; [database setup](./database.md) for migration credentials.

**First local run**

1. Finish the repository's normal local database, authentication, and storage
   setup. `pnpm db:up` starts the ordinary Compose services when needed; it does
   not start search. Use the repository's pnpm version. The scheduler image uses
   Node 24 and pnpm 11.22.0.
2. Review and apply pending migrations yourself with migration credentials:

   ```sh
   pnpm db:migrate
   ```

   Search's committed migrations are `0030_sparkling_pet_avengers.sql` and
   `0031_search_outbox_triggers.sql`. Do not regenerate or rename them. The user
   reported applying 0030; applying 0031 and setting the worker password have not
   been confirmed in the implementation conversation. Check your own migration
   state rather than assuming this document proves installation.
3. Set the `search_worker` password using your own database tooling and migration
   administrator. It is deliberately absent from committed SQL:

   ```sql
   ALTER ROLE search_worker WITH PASSWORD '<local-password>';
   ```

   This role reads indexed source fields and writes operational state. Keep each
   app's normal database role unchanged. Application logins cannot process the
   outbox.
4. For a fresh clone, create the host tooling configuration:

   ```sh
   cp .env.search.example .env.search.local
   ```

   If it already exists, edit it instead of overwriting it. Set these values:

   | Variable | Local host value |
   | --- | --- |
   | `MEILISEARCH_URL` | `http://localhost:7700` |
   | `MEILI_MASTER_KEY` | Your randomly generated local master key, at least 16 bytes |
   | `SEARCH_DATABASE_URL` | Local PostgreSQL URL using `search_worker` and its actual password |

   URL-encode special characters in database passwords. Earlier population-only
   setups may still use `admin_app`; update them to `search_worker` before sync.
5. Start the persistent engine, initialize indexes/keys, and populate documents:

   ```sh
   pnpm search:up
   pnpm search:setup
   pnpm search:index
   ```

   Setup creates/configures seven indexes and reuses the stable scoped keys. It
   writes `.env.search.generated.local` with restrictive permissions and does
   not print credentials. Setup alone leaves indexes empty; population reads
   current database projections. Neither command runs migrations or seeds data.
6. Copy generated configuration into each app's existing `.env.local`:

   | App | Generated variables to copy |
   | --- | --- |
   | Client | `NEXT_PUBLIC_MEILISEARCH_URL`, `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` |
   | Admin | `MEILISEARCH_URL`, `MEILISEARCH_ADMIN_SEARCH_KEY` |

   Keep privileged keys out of `NEXT_PUBLIC_` variables. Leave the worker key in
   local tooling configuration. Root tooling loads the two search env files;
   Next.js apps load their own app env files. Explicit process env values take
   precedence. Restart app development servers after editing their configuration.
7. Run the apps with their normal development command, `pnpm dev`. Public search
   queries the engine directly; admin search requires a separate admin login and
   goes through `/api/search`. This is navigation search, not a replacement for
   product loading, detail queries, or checkout validation.

All local search env files are ignored by Git. The engine's named volume keeps
indexes across container replacement. Its `MEILI_ENV=production` setting enables
engine authentication; it is separate from the app's `NODE_ENV` availability rule.

**Manual synchronization**

Database triggers enqueue relevant entity IDs transactionally. Installing them
does not start a worker or backfill existing rows. After editing an indexed
field, run a bounded sync without waiting for cron:

```sh
pnpm search:sync
pnpm search:sync --max-jobs 25
```

The default is 100 claims; the allowed bound is 1–10000. Successful replacements
and deletions are acknowledged only after all required engine tasks succeed.
Deleted or newly ineligible entities produce document removals. Newer writes
remain pending even when older tasks complete. Processes close their database
pools and exit.

Failed jobs remain queued. Retry delay grows from 30 seconds to 15 minutes;
running sync before `availableAt` does not bypass that delay. A genuine new edit
makes its entity due again. A shared lease prevents simultaneous sync and
reconciliation; an already-owned lease produces a successful skip.

**Daily repair and full rebuilding**

For missed capture, missing documents, obsolete content, or index orphans:

```sh
pnpm search:reconcile
pnpm search:reconcile --batch-size 50 --max-jobs 500
```

Reconciliation compares projected content, then scans indexed IDs for missing or
ineligible source records. Counts alone are insufficient. Repairs enter the same
outbox, preserving task recovery state, and are processed after scanning. The
default page size is 100 (maximum 200), and the default claim bound is 1000
(maximum 10000). Overflow remains queued for later syncs. This is not a single
database snapshot; concurrent changes can require another pass.

Population only replaces IDs it reads and does not remove source-deleted IDs.
For an explicit clear-and-refill operation, stop scheduling and keep application
writes and all other indexing commands idle, then use:

```sh
pnpm search:worker:stop
pnpm search:rebuild
```

Manual population/rebuild does not use the worker lease. Let running workers
finish and recover any saved in-flight tasks before rebuilding. A local rebuild
accepts temporarily empty/incomplete indexes; a failure can leave partial data.
Correct the failure and rerun it. Settings and API keys are preserved. After an
engine reset, run setup again, repopulate, and refresh app/worker credentials
before restarting scheduling.

**Optional local scheduling**

Prepare the scheduler's separate configuration for the repository's Compose DB:

```sh
cp .env.search.docker.example .env.search.docker.local
```

Use the same worker database password, with `db:5432` and
`http://meilisearch:7700` as the service addresses. Host commands continue using
localhost URLs. The scheduler mounts this file at the normal tooling input path
and mounts `.env.search.generated.local` separately. Both files must exist; they
are mounted read-only and are excluded from the image build context.

```sh
pnpm search:worker:up
pnpm search:worker:logs
pnpm search:worker:stop
```

Startup builds the image and starts cron plus its declared dependencies. It does
not install database objects, initialize keys, populate indexes, or immediately
run sync. `docker/search/crontab` schedules outbox processing every 15 minutes and
reconciliation daily at 03:07 UTC. Each invocation exits after work. The idle
scheduler has no PostgreSQL listener or worker pool.

The separate `search-worker` profile keeps scheduling out of `pnpm dev`,
`pnpm db:up`, and `pnpm search:up`. Missed cron times while stopped are not
replayed, but queued jobs remain. The scheduler restarts with Docker until
explicitly stopped. Container logs may stay quiet until the next invocation.

Stop both search services while preserving engine data with `pnpm search:stop`.
PostgreSQL and object storage remain running. To run a worker once using the
container's mounted configuration instead of host tooling:

```sh
docker compose --env-file .env.search.local --profile search --profile search-worker run --rm search-scheduler search-job sync
```

**Inspecting failures**

Use your own database UI to inspect:

| Table | Useful state |
| --- | --- |
| `admin.search_outbox` | Entity, current/task versions, attempts, `availableAt`, lease expiry, saved task UIDs, sanitized error |
| `admin.search_sync_runs` | Mode, status, timestamps, processed/failed jobs, document activity, sanitized error |
| `admin.search_sync_leases` | Current owner and database-clock expiry |

A run with failed jobs exits nonzero and leaves them recoverable. No work,
production skipping, and lease contention are successful exits. Run counts show
activity, not proof of consistency. A later lease owner marks abandoned running
records interrupted. Leases last 120 seconds and renew between bounded calls;
expiry does not cancel remote tasks. Saved task references are recovered before
conflicting fresh writes. Avoid deleting operational rows to force a retry.

| Symptom | Check or action |
| --- | --- |
| Only the local-demo message appears | `NODE_ENV=production` intentionally disables queries. Use development mode locally. |
| Engine is healthy but results are empty | Setup does not populate data. Run population; public products also need active publication, not trashed, and a non-null listing price. |
| Public adapter is unconfigured | Copy both generated public values into the client app env file and restart development. |
| Admin request returns 401/403 | Use an admin account with the relevant existing permissions; customer login is separate. |
| Worker has database permission errors | Apply the pending local trigger/role migration yourself and use the `search_worker` login/password. |
| Jobs wait after an error | Check retry time, connectivity, credentials, lease ownership, and backlog; rerun after work becomes due. |
| Known drift has no outbox entry | Run reconciliation; it repairs missing capture as well as index orphans. |
| Scheduler cannot mount configuration | Create both its Docker env file and the generated key file before starting it. |
| Search shows a withdrawn preview | Sync is eventual; detail and checkout pages still use current PostgreSQL state. |

The cadence is a starting point, not a 15-minute freshness guarantee. Backlog,
scheduler delay, retries, and asynchronous indexing add latency. The submission/
task-persistence gap can repeat an idempotent operation after a crash. Delivery
is at least once; daily repair handles drift. There is no distributed exactly-once
guarantee or availability-preserving staging-index swap.

**Keyword history**

History stores the latest ten unique keywords, trimmed and deduplicated without
case sensitivity. Enter or result selection saves a keyword; typing alone does
not. Clicking a chip reruns search without cached results. Each chip can be
removed, and clear-all deletes the stored history.

Public keywords use localStorage key `shopinext:search:public`. Admin keywords use
sessionStorage keys starting `shopinext:search:admin:`, followed by the encoded
account ID. The layout supplies that ID without another auth request. Successful
admin logout clears the tab's admin history keys; failed logout preserves them.
Other storage is untouched. Storage failures are caught and never block search.
No results, document snapshots, session IDs, or search analytics are persisted.

**Validation commands and limits**

The required static check is:

```sh
pnpm check
```

It type-checks all seven packages/apps and lints the apps. It does not run tests.
The existing admin root-layout unused `Geist` warning is unrelated to search.

These optional test commands were not executed during implementation:

```sh
pnpm --filter @repo/search-tooling run test:unit
pnpm --filter client exec playwright test e2e/ui/search
pnpm --filter admin exec playwright test e2e/ui/search e2e/ui/categories/search-destinations.spec.ts e2e/api/search.spec.ts
```

Unit sources cover projections, query access, demo privacy, production guards,
history, task recovery, and version/ownership predicates. The latter use a fake
PostgreSQL driver to inspect real Drizzle queries, not live concurrency tests.
UI tests intercept search transport; they still require each app's existing test
database/auth setup and normal Playwright prerequisites. They need no live
Meilisearch. Existing project dependencies may run preparatory tests as well.

Runtime acceptance is still outstanding: trigger rollback/no-op/dependency
behavior and grants; worker interruption with concurrent edits; actual engine
typo relevance (`dhirt` → `shirt`); scheduler image/mounts/timing; browser focus,
responsive placement, history, and logout. Agents must not run tests or perform
database/migration operations without the user's explicit authorization.
