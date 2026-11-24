# ShopiNext

> **Status:** Active development — full-stack e-commerce storefront and staff operations dashboard built as a Turborepo monorepo.
>
> **Live Deployments:** [Storefront](https://shopinext.mattanis.dev/) (`https://shopinext.mattanis.dev/`) · [Admin Dashboard](https://admin.shopinext.mattanis.dev/) (`https://admin.shopinext.mattanis.dev/`)

ShopiNext is a modern, production-minded e-commerce platform pairing a customer-facing storefront (`apps/client`) with a role-based admin dashboard (`apps/admin`). It emphasizes strict database isolation, least-privilege PostgreSQL roles, idempotent payment & email pipelines, direct-to-S3 presigned uploads, transactional outbox search synchronization, and parallel sharded end-to-end testing.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Monorepo Structure](#monorepo-structure)
- [Database & Schema Design](#database--schema-design)
- [Authentication & RBAC](#authentication--rbac)
- [Stripe Checkout & Order Fulfillment](#stripe-checkout--order-fulfillment)
- [Media Storage (S3 / SeaweedFS)](#media-storage-s3--seaweedfs)
- [Search Architecture (Local Meilisearch)](#search-architecture-local-meilisearch)
- [Testing & CI/CD Pipeline](#testing--cicd-pipeline)
- [Local Development Setup](#local-development-setup)
- [Scripts Reference](#scripts-reference)
- [Documentation Index](#documentation-index)
- [Roadmap](#roadmap)
- [License](#license)

---

## Architecture Overview

ShopiNext isolates customer and staff domains across two independent Next.js App Router applications, two separate Better Auth setups, two PostgreSQL schemas (`public` and `admin`), and four dedicated least-privilege PostgreSQL roles.

```mermaid
flowchart TB
    subgraph Apps["Next.js 16 Applications"]
        Client["Storefront App\n(apps/client · :3000)"]
        Admin["Admin Dashboard\n(apps/admin · :3001)"]
    end

    subgraph Packages["Shared Workspace Packages"]
        UI["@repo/ui\nshadcn/ui + Base UI + Tokens"]
        DBPkg["@repo/db\nSchema Definitions Only"]
        SearchPkg["@repo/search\nContracts, Settings & Mappers"]
        DBTool["@repo/db-tooling\nSeeds, Wipe & Trigger SQL"]
        SearchTool["@repo/search-tooling\nSetup, Index, Outbox & Reconcile"]
    end

    subgraph Data["Data & Local Services"]
        PG[("PostgreSQL 16\npublic + admin schemas")]
        S3[("S3 / SeaweedFS\nProduct Media :8333")]
        Meili[("Meilisearch v1.57\nLocal-Only Search :7700")]
    end

    subgraph External["External Services"]
        Stripe["Stripe Checkout\n& Webhooks"]
        Resend["Resend\nTransactional Emails"]
    end

    Client --> UI
    Client --> DBPkg
    Client --> SearchPkg
    Admin --> UI
    Admin --> DBPkg
    Admin --> SearchPkg
    DBTool --> DBPkg
    SearchTool --> DBPkg
    SearchTool --> SearchPkg

    Client -- "client_app role (public only)" --> PG
    Admin -- "admin_app role (public + admin)" --> PG
    SearchTool -- "search_worker role" --> PG

    Client -- "Checkout & Webhooks" --> Stripe
    Client -- "Auth & Order Confirmations" --> Resend
    Admin -- "Staff Invites & Status Emails" --> Resend
    Admin -- "Presigned PUT / Delete" --> S3
    Client -- "Public Read (GET)" --> S3

    Client -- "Direct Public Search Key" --> Meili
    Admin -- "RBAC-Guarded /api/search" --> Meili
    SearchTool -- "Worker API Key" --> Meili
```

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Monorepo & Tooling** | Turborepo (`2.10`), pnpm (`11.22`), TypeScript (`5`), Node.js (`24` in CI/Docker), ESLint (`9`), Prettier (`3.8`) |
| **Web Framework** | Next.js (`16.3` client / `16.2` admin, App Router), React (`19.2`) |
| **UI & Styling** | Tailwind CSS (`v4`), shadcn/ui, Base UI (`@base-ui/react`), Lucide Icons, `next-themes`, Motion, Embla Carousel, `@tanstack/react-table`, `@dnd-kit/react` |
| **Database & ORM** | PostgreSQL (`16`), Drizzle ORM (`0.45.2`), Drizzle Kit (`0.31.10`), `pg`, `drizzle-seed` |
| **Authentication & RBAC** | Better Auth (`1.6`) with JWE session cookie cache, OAuth, email verification, password reset, and Admin Access Control plugin |
| **Payments & Email** | Stripe (`22.5`) Checkout + signed webhooks, Resend (`6.20`) with idempotent delivery |
| **Object Storage** | AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) with SeaweedFS locally |
| **Search (Local Demo)** | Meilisearch (`v1.57.0`, SDK `0.62.0`), `unified` / `remark` / `hast-util-to-text` plain-text projection |
| **Validation & Forms** | Zod (`v4`), React Hook Form |
| **Testing & CI** | Playwright (`1.62`) parallel sharded E2E suites, `tsx --test` unit tests, GitHub Actions |

---

## Key Features

### Customer Storefront (`apps/client`)
- **Catalog & Discovery**: Responsive product grid with cursor-based pagination, URL-driven name filtering and sorting, loading skeletons, retryable pagination, category browsing (`/categories`, `/categories/[slug]`), and purchasable related products.
- **Product Pages**: Markdown-rendered descriptions (`remark-gfm`), category badges, interactive option/variant selectors, real-time stock & per-order purchase limits, and inline "Add to Cart" variant pickers directly on product cards.
- **Hybrid Cart**: Cookie-backed guest cart and PostgreSQL-backed authenticated cart that automatically merges guest items on sign-in (via a Better Auth after-hook) and resets cleanly on logout.
- **Stripe Checkout**: Unified server-side session builder for both "Buy Now" and full cart checkout, reliable webhook order persistence, atomic stock deduction, and idempotent payment confirmation emails via Resend.
- **Customer Account**: Email/password and OAuth sign-in, email verification, password resets that revoke all active sessions, profile/settings management, active session inspection with per-device or global sign-out, email-verified account deletion (retaining historical paid orders), and paginated order history with public status timelines.
- **Responsive Experience**: Persistent light/dark theme switching, desktop and slide-out mobile navigation, storefront footer with policy pages (`/privacy-policy`, `/term-of-service`), and local-only typo-tolerant global search with removable recent keyword chips.

### Admin Dashboard (`apps/admin`)
- **Shop Overview & Analytics**: Responsive graphite and ShopiNext yellow interface with KPI metrics, weekly sales and order volume charts, recent order feeds, attention alerts, and order / low-stock variant drill-down views.
- **Navigation & Mobile UX**: Collapsible desktop sidebar rail with hover expansion, pin toggle, and proximity glow; sticky frosted header; centered global search bar; light/dark theme toggle; and compact mobile card layouts for products, orders, and editors.
- **Product Management**: Multi-step creation and non-linear semantic edit wizard covering details (with a tabbed live-preview Markdown editor), categories and product options, variants with database-enforced unique option signatures, and drag-and-drop image galleries (`@dnd-kit/react`) backed by direct-to-S3 uploads. Supports independent `draft` / `active` publication status and `isActive` soft-deletion.
- **Categories & Media**: Slug-aware category management with URL-driven drawer selection (`/categories?categoryId=...`) supporting read-only inspection for non-editing roles, plus a centralized read-only media inventory view.
- **Order Operations**: Active and archived order tables, status lifecycle management (`paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`), automatic customer notification emails on status updates, audit timelines, and internal Slack-style staff notes (`admin.order_notes`) with inline editing and deletion.
- **Customers & Staff**: Read-only customer directory and detail pages (with order history and spend totals excluding cancelled orders), plus staff creation/invites, role management, ban controls, and active session revocation.
- **Role-Based Access Control (RBAC)**: 4-tier permission matrix (`owner`, `manager`, `staff`, `demo`) enforced across page routes, Server Actions, API endpoints, and UI visibility, including automatic PII email masking and raw-email search suppression for the `demo` role.

---

## Monorepo Structure

```text
shopiNext/
├── .github/workflows/          # Path-filtered CI/CD, sharded Playwright E2E, prod DB migrations
├── apps/
│   ├── client/                 # Customer storefront (Next.js App Router, port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, signup, forgot/reset password, verified account deletion
│   │   │   ├── (policies)/     # Privacy policy & terms of service
│   │   │   ├── (shop)/         # Catalog, categories, product pages, checkout, (account) profile & orders
│   │   │   └── api/            # Better Auth handler, /api/checkout/complete, /api/webhooks/stripe
│   │   ├── features/           # Domain modules: account, cart, categories, checkout, orders, products
│   │   ├── lib/                # Client auth, Stripe client, Resend email, direct Meilisearch adapter
│   │   └── e2e/                # Parallel Playwright API & UI specs
│   └── admin/                  # Admin dashboard (Next.js App Router, port 3001)
│       ├── app/
│       │   ├── (protected)/    # Overview, products wizard, categories, orders, customers, media, staff
│       │   ├── login/          # Redesigned sign-in screen
│       │   ├── reset-password/ # Staff password reset
│       │   ├── unauthorized/   # RBAC fallback page
│       │   └── api/            # Better Auth handler & RBAC-guarded /api/search Route Handler
│       ├── features/           # Domain modules: categories, customers, media, orders, products, staff
│       ├── lib/                # Modular auth/RBAC guards, S3 presigner, email, admin search service
│       └── e2e/                # Parallel Playwright API & UI specs
├── packages/
│   ├── db/                     # Pure Drizzle schemas (no runtime logic): public/ & admin/
│   ├── db-tooling/             # Database seeding, wiping, and ordered SQL trigger sources
│   ├── ui/                     # Shared shadcn/ui + Base UI components, GlobalSearch, Markdown, tokens
│   ├── search/                 # Browser-safe & server-only search contracts, settings, history
│   └── search-tooling/         # Meilisearch setup, full indexing, outbox sync, reconciliation, unit tests
├── drizzle/                    # 32 SQL migrations (0000–0031), including roles & triggers
├── docker/                     # SeaweedFS S3 IAM config & opt-in search cron scheduler image
├── docs/                       # Deep architectural and operational guides
├── docker-compose.yml          # PostgreSQL 16, SeaweedFS S3 (+ bucket init), optional Meilisearch & scheduler
├── docker-compose.test.yml     # Isolated test PostgreSQL (:5433) and SeaweedFS (:8334)
├── drizzle.config.ts           # Single root Drizzle config targeting both public & admin schemas
└── turbo.json                  # Turborepo task graph (dev, build, lint, typecheck, check, test:e2e)
```

---

## Database & Schema Design

PostgreSQL 16 is split into two schemas managed by a single root Drizzle configuration (`drizzle.config.ts`). Runtime code never lives in `packages/db`; each app imports only the schemas it is permitted to read.

### Least-Privilege Database Roles

| Role | Schema / Table Scope | Privileges | Purpose |
| --- | --- | --- | --- |
| `postgres` (superuser) | Full database | DDL + DML | Migrations only (`drizzle-kit migrate`). Role name must never match a schema name (`public`, `admin`). |
| `client_app` | `public` schema only | `SELECT, INSERT, UPDATE, DELETE` | Customer storefront runtime (`apps/client`). Cannot see `admin` tables or alter schema. |
| `admin_app` | `public` + `admin` (except search ops) | `SELECT, INSERT, UPDATE, DELETE` | Admin dashboard runtime (`apps/admin`). Explicitly revoked from mutating search outbox/lease tables. |
| `search_worker` | Indexed source columns + `admin.search_*` | `SELECT` on sources; DML on search ops | Local indexing, outbox sync, and reconciliation worker (`packages/search-tooling`). |
| `search_outbox_writer` | `admin.search_outbox` + category links | Non-login `SECURITY DEFINER` trigger owner | Enqueues outbox refresh IDs inside application write transactions without exposing operational tables to app roles. |

### Key Database Invariants

- **Soft-delete (`isActive`) vs. publication (`status`)**: On `products`, `product_variants`, and `categories`, `isActive = false` means trashed (preserving historical order references), whereas `products.status` (`draft` | `active`) tracks wizard publication state. Storefront queries enforce both gates.
- **Trigger-maintained `products.minPrice`**: Migration `0015_add_products_min_price_trigger.sql` maintains the lowest in-stock variant price on `products.minPrice` (or `NULL` when sold out), backed by a partial index (`WHERE minPrice IS NOT NULL AND isActive AND status = 'active'`) so storefront listings avoid re-aggregating variant trees on every read.
- **Unique variant signatures**: `product_variants` enforces uniqueness on `(productId, optionSignature)` and `sku` across active variants.

---

## Authentication & RBAC

Both apps run completely independent Better Auth instances:
- **Client Auth** (`apps/client/lib/auth.ts`): Stores accounts in the `public` schema, supports email/password + OAuth, email verification, password reset, active session revocation, verified account deletion, and automatic guest-to-DB cart merging on sign-in.
- **Admin Auth** (`apps/admin/lib/auth/`): Stores staff accounts in the `admin` schema and uses a two-layer check — a fast cookie presence bounce in `proxy.ts`, followed by authoritative session validation in `app/(protected)/layout.tsx` backed by an encrypted **JWE session cookie cache** (`session.cookieCache`) to avoid unnecessary DB round-trips while keeping cached user payloads unreadable at rest.

### Admin Permission Matrix (`apps/admin/lib/auth/permissions.ts`)

| Resource | `owner` | `manager` | `staff` | `demo` |
| --- | --- | --- | --- | --- |
| **Products / Categories / Media** | Create, Read, Update, Delete | Create, Read, Update, Delete | Read | Read |
| **Orders** | Create, Read, Update, Delete | Create, Read, Update, Delete | Read, Update | Read |
| **Customers** | Read, Update | Read, Update | Read | Read (PII emails masked) |
| **Analytics** | Read | Read | — | Read |
| **Staff Users (`user`)** | Full management (create, role, ban, impersonate, delete) | List, Get | — | — |
| **Staff Sessions (`session`)** | List, Revoke, Delete | List | — | — |

---

## Stripe Checkout & Order Fulfillment

Both "Buy Now" and full-cart checkouts funnel into a single `createCheckoutSession` server builder that always looks up authoritative variant prices and stock limits from PostgreSQL. Order creation lives strictly in the signed webhook handler so a closed browser tab never loses a paid order.

```mermaid
sequenceDiagram
    actor Customer
    participant Browser
    participant Action as Server Action (checkoutNow / checkoutCart)
    participant Stripe as Stripe Checkout
    participant Complete as GET /api/checkout/complete
    participant Webhook as POST /api/webhooks/stripe
    participant PG as PostgreSQL
    participant Resend as Resend Email

    Customer->>Browser: Click "Buy now" or "Checkout"
    Browser->>Action: Submit variant quantities
    Action->>PG: Verify prices, stock & maxPerOrder
    Action->>Stripe: Create Checkout Session (metadata: userId, source)
    Stripe-->>Browser: Redirect to Stripe hosted checkout
    Customer->>Stripe: Complete payment

    par Browser Redirect (best-effort UX)
        Stripe-->>Browser: Redirect to /api/checkout/complete
        Browser->>Complete: Validate session_id
        Complete->>Browser: Clear guest cart cookie (if guest + cart)
        Complete-->>Browser: Redirect to /checkout/success
    and Signed Webhook (guaranteed + retried)
        Stripe->>Webhook: POST checkout.session.completed
        Webhook->>Webhook: Verify STRIPE_WEBHOOK_SECRET
        Webhook->>PG: Lookup or insert order by stripeSessionId (idempotent)
        Webhook->>PG: Commit items, stock deduction, timeline & clear DB cart
        Webhook->>Resend: Send confirmation (idempotency key: order-confirmation/id)
        Resend-->>Webhook: Accepted email ID
        Webhook->>PG: Record confirmationEmailSentAt
        Webhook-->>Stripe: 200 OK (or 500 to trigger retry)
    end
```

---

## Media Storage (S3 / SeaweedFS)

Product images are uploaded directly from the admin browser to S3-compatible storage using short-lived (15-minute) presigned `PUT` URLs generated via `@aws-sdk/s3-request-presigner`, keeping binary payloads off the Next.js server.

- **Local Development**: Runs **SeaweedFS** (`chrislusf/seaweedfs` on port `8333`) via `docker-compose.yml`, paired with an `s3-init` container that auto-provisions the `store` bucket and `docker/seaweedfs-s3.json` granting `anonymous` read-only access for storefront `<img>` rendering and `localdev` authenticated access for presigned uploads and deletions.
- **SDK v3 Compatibility**: `apps/admin/lib/storage.ts` explicitly sets `requestChecksumCalculation: "WHEN_REQUIRED"` and `responseChecksumValidation: "WHEN_REQUIRED"` to prevent AWS SDK v3.700+ placeholder CRC32 headers from triggering `400 Bad Request` errors on SeaweedFS, MinIO, or Cloudflare R2.
- See [`docs/storage.md`](./docs/storage.md) for production IAM and CDN recommendations.

---

## Search Architecture (Local Meilisearch)

Global navigation search is a deliberate portfolio architecture demonstrating typo-tolerant search (e.g., `dhirt` → `shirt`), physically isolated public/admin indexes, transactional outbox capture, leased asynchronous task recovery, and daily drift reconciliation.

- **Local-Only Boundary**: Search is enabled in local development and intentionally disabled whenever `NODE_ENV === "production"` (including hosted deployments and local production builds) with no extra feature flag or hosted search credentials required.
- **Seven Dedicated Indexes**:
  - **Public (`public_products`, `public_categories`)**: Queried directly by the client browser using an intentionally public, search-only scoped API key. Only active, published, in-stock products (`isActive = true`, `status = 'active'`, `minPrice IS NOT NULL`) are indexed.
  - **Admin (`admin_products`, `admin_categories`, `admin_orders`, `admin_customers`, `admin_staff`)**: Mediated through `GET /api/search`, which validates the Better Auth session once, selects permitted indexes via `hasRolePermission`, suppresses raw email search attributes for `demo` users, and masks email preview fields.
- **Keyword History**: Stores up to 10 unique trimmed keywords on commit (`Enter` or result selection) — in `localStorage` for the storefront and account-scoped `sessionStorage` (cleared on logout) for the admin app.

```mermaid
flowchart LR
    subgraph QueryPath["Query Paths (Local Dev Only)"]
        StoreUI["Storefront Search Bar"] -- "Public Search Key\n(direct multi-search)" --> PubIdx[("public_products\npublic_categories")]
        AdminUI["Admin Search Bar"] -- "Session Cookie" --> Route["GET /api/search\n(RBAC + Demo Masking)"]
        Route -- "Server Admin Key\n(permitted indexes only)" --> AdmIdx[("admin_products\nadmin_categories\nadmin_orders\nadmin_customers\nadmin_staff")]
    end

    subgraph SyncPath["Transactional Outbox & Daily Repair"]
        Writes["App / Script Writes"] --> PG[("PostgreSQL 16")]
        PG -- "SECURITY DEFINER Triggers\n(same transaction)" --> Outbox[("admin.search_outbox\n+ leases & runs")]
        Worker["search-tooling Worker\n(15m cron or manual CLI)"] -- "Claim lease & read\ncurrent projections" --> PG
        Worker -- "Replace / Delete +\nawait task succeeded" --> PubIdx
        Worker -- "Replace / Delete +\nawait task succeeded" --> AdmIdx
        Worker -. "Daily 03:07 UTC\nReconciliation Scan" .-> Outbox
    end
```

See [`docs/search.md`](./docs/search.md), [`docs/search-outbox.md`](./docs/search-outbox.md), and [`docs/search-operations.md`](./docs/search-operations.md) for full contracts, alternatives, and recovery steps.

---

## Testing & CI/CD Pipeline

Playwright runs with `fullyParallel: true` across multiple workers sharing an isolated test database (`docker-compose.test.yml` on port `5433`), enforcing namespaced fixtures (`uniqueSuffix()`), serial empty-state suites (`empty-state.spec.ts`), scoped locators, hydration-safe clicks (`clickUntilHydrated`), and `expect.poll` database verification.

GitHub Actions (`.github/workflows/pipeline.yml`) filters changed paths to run only affected suites, shards both Playwright suites, and gates production Drizzle migrations behind passing tests on `main`:

```mermaid
flowchart LR
    Trigger["Push to main / PR /\nworkflow_dispatch"] --> Changes["Detect Changed Paths\n(dorny/paths-filter)"]

    Changes -- "apps/client, packages,\ndrizzle, lockfile" --> ClientCI["client-tests.yml\n(Sharded Playwright E2E)"]
    Changes -- "apps/admin, packages,\ndrizzle, lockfile" --> AdminCI["admin-tests.yml\n(Sharded Playwright E2E)"]

    ClientCI --> Gate{"All green &\nbranch == main &\ndrizzle/ changed?"}
    AdminCI --> Gate
    Changes --> Gate

    Gate -- "Yes" --> Migrate["prod-migrate.yml\n(drizzle-kit migrate\non production env)"]
    Gate -- "No" --> Done["Pipeline Complete"]
```

---

## Local Development Setup

### Prerequisites
- **Node.js** 24+ (LTS)
- **pnpm** `11.22.0` (`corepack enable`)
- **Docker & Docker Compose**
- **Stripe CLI** (for local webhook forwarding)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start PostgreSQL & SeaweedFS S3
```bash
pnpm db:up
```
This starts PostgreSQL 16 (`localhost:5432`), SeaweedFS S3 (`localhost:8333`), and auto-creates the `store` bucket via `s3-init`.

### 3. Configure Environment Variables

Create the following local environment files (all git-ignored):

- **Root `.env.local`** (superuser credentials for Drizzle migrations & tooling):
  ```env
  DATABASE_URL=postgresql://postgres:secret@localhost:5432/store
  DATABASE_URL_TEST=postgresql://postgres:secret@localhost:5433/test
  ```
- **`apps/client/.env.local`**:
  ```env
  DATABASE_URL=postgresql://client_app:<client-password>@localhost:5432/store
  BETTER_AUTH_SECRET=<random-secret>
  BETTER_AUTH_URL=http://localhost:3000
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  RESEND_API_KEY=re_...
  ```
- **`apps/admin/.env.local`**:
  ```env
  DATABASE_URL=postgresql://admin_app:<admin-password>@localhost:5432/store
  BETTER_AUTH_SECRET=<random-secret>
  BETTER_AUTH_URL=http://localhost:3001
  RESEND_API_KEY=re_...
  STORAGE_ENDPOINT=http://localhost:8333
  STORAGE_BUCKET=store
  STORAGE_ACCESS_KEY_ID=localdev
  STORAGE_SECRET_ACCESS_KEY=localdevsecret
  STORAGE_PUBLIC_URL=http://localhost:8333/store
  STORAGE_REGION=us-east-1
  ```

### 4. Run Migrations, Set App Role Passwords & Seed Data
```bash
pnpm db:migrate
```

Application roles are created without passwords in git-tracked SQL; set them once per environment:
```bash
docker exec -i store_db psql -U postgres -d store -c "ALTER ROLE admin_app WITH PASSWORD '<admin-password>';"
docker exec -i store_db psql -U postgres -d store -c "ALTER ROLE client_app WITH PASSWORD '<client-password>';"
```

Seed sample categories, products, variants, customers, orders, and all four RBAC admin accounts:
```bash
pnpm db:seed
```

### 5. Run the Applications
```bash
pnpm dev
```
- **Storefront**: `http://localhost:3000`
- **Admin Dashboard**: `http://localhost:3001`

To forward Stripe webhooks locally:
```bash
pnpm --filter client stripe:listen
```

### 6. Optional: Enable Local Meilisearch
Follow [`docs/search-operations.md`](./docs/search-operations.md) for the complete checklist. In short:
```bash
# 1. Set search_worker role password in PostgreSQL
docker exec -i store_db psql -U postgres -d store -c "ALTER ROLE search_worker WITH PASSWORD '<worker-password>';"

# 2. Configure host search env
cp .env.search.example .env.search.local
# Edit MEILI_MASTER_KEY (>=16 random bytes) and SEARCH_DATABASE_URL

# 3. Start Meilisearch, initialize indexes/keys, and populate documents
pnpm search:up
pnpm search:setup
pnpm search:index
```
Then copy the generated `NEXT_PUBLIC_MEILISEARCH_*` values from `.env.search.generated.local` into `apps/client/.env.local`, and `MEILISEARCH_URL` + `MEILISEARCH_ADMIN_SEARCH_KEY` into `apps/admin/.env.local`, and restart `pnpm dev`.

---

## Scripts Reference

| Command | Description |
| --- | --- |
| `pnpm dev` | Run both Next.js apps in development (`client` on `:3000`, `admin` on `:3001`) |
| `pnpm build` | Build all apps and packages via Turborepo |
| `pnpm check` | Run typecheck across all workspaces and ESLint across apps |
| `pnpm lint` / `pnpm typecheck` | Run linting or TypeScript checks independently |
| `pnpm db:up` / `pnpm db:down` | Start or stop local PostgreSQL 16 and SeaweedFS S3 containers |
| `pnpm db:up:test` / `pnpm db:down:test` | Start or stop isolated E2E test containers (Postgres `:5433`, SeaweedFS `:8334`) |
| `pnpm db:generate` | Generate a new Drizzle migration from `packages/db` schema changes |
| `pnpm db:migrate` / `pnpm db:migrate:test` | Apply pending Drizzle migrations to dev or test database |
| `pnpm db:studio` | Launch Drizzle Studio |
| `pnpm db:seed` / `pnpm db:wipe` | Seed sample storefront/admin data or wipe database tables |
| `pnpm search:up` / `pnpm search:stop` | Start Meilisearch container or stop search services (preserving data volume) |
| `pnpm search:setup` | Create/configure the 7 Meilisearch indexes and scoped API keys |
| `pnpm search:index` / `pnpm search:rebuild` | Populate indexes from PostgreSQL or perform a clean clear-and-refill rebuild |
| `pnpm search:sync` / `pnpm search:reconcile` | Run one-shot outbox synchronization or full database-to-index drift repair |
| `pnpm search:worker:up` / `stop` / `logs` | Manage the optional local cron scheduler container (15m sync, daily 03:07 UTC reconcile) |
| `pnpm test:e2e` | Run Playwright E2E test suites across apps |
| `pnpm --filter @repo/search-tooling run test:unit` | Run unit tests for search projections, access boundaries, and sync recovery |

---

## Documentation Index

| Document | Scope |
| --- | --- |
| [`docs/database.md`](./docs/database.md) | Superuser naming rules, app role passwords, `isActive` vs `status`, and the `products.minPrice` trigger |
| [`docs/storage.md`](./docs/storage.md) | Direct-to-S3 presigned upload flow, SeaweedFS config, AWS SDK v3 checksum caveat, and production IAM |
| [`docs/search.md`](./docs/search.md) | Meilisearch contracts, public/admin boundaries, typo settings, synchronization design, and alternatives |
| [`docs/search-outbox.md`](./docs/search-outbox.md) | Outbox/run/lease tables, version fencing, PostgreSQL trigger SQL, and `search_worker` grants |
| [`docs/search-operations.md`](./docs/search-operations.md) | Ordered local search setup, manual sync/reconcile/rebuild, cron scheduler, and troubleshooting |
| [`docs/tradeoffs.md`](./docs/tradeoffs.md) | Documented architectural tradeoffs (e.g., eager-loading variants on listing queries) |
| [`apps/admin/docs/auth-flow.md`](./apps/admin/docs/auth-flow.md) | Two-layer admin auth flow (`proxy.ts` + `(protected)/layout.tsx`) and JWE session cookie cache |
| [`apps/client/docs/stripe-checkout-flow.md`](./apps/client/docs/stripe-checkout-flow.md) | Checkout session creation, parallel redirect vs. webhook fulfillment, cart clearing, and email retries |

---

## Roadmap

### MVP
- [x] Product listing page
- [x] Product detail page
- [x] Cart (add/remove/update quantity, guest and signed-in with automatic merge)
- [x] Authentication
- [x] Guest checkout
- [x] Stripe checkout
- [x] Order confirmation page

### V1
- [x] Email verification
- [x] Password reset & session management
- [x] OAuth & email-verified account deletion
- [x] Order history page
- [x] Order receipt email (idempotent via Resend)
- [x] Order status tracking & status update emails
- [x] Admin panel (product creation/edit wizard, listing, detail view)
- [x] Staff roles & permissions (4-tier RBAC + demo PII masking)
- [x] Staff invite & management
- [x] Product images (direct-to-S3 presigned uploads + drag-and-drop reordering)
- [x] Product categories (slug routing & drawer deep-linking)
- [x] Product variants (options, SKUs, unique signatures, per-variant stock & pricing)
- [x] Stock & per-order purchase limits enforced at checkout
- [x] Search and filters (URL catalog discovery + local Meilisearch global search)
- [x] Dashboard analytics (overview KPIs, weekly sales/order charts, low-stock alerts)
- [ ] Address management
- [ ] Basic SEO (structured metadata, sitemap, robots)
- [ ] Promotional features

### Later
- [ ] Abandoned cart emails
- [ ] Extended email notifications
- [ ] Reviews & comments
- [ ] Coupons & discounts
- [ ] Shipping & tax settings
- [ ] Wishlist
- [ ] Inventory & stock management enhancements
- [ ] Returns & refunds
- [ ] Staff chat
- [ ] Full Docker setup for self-hosting

---

## License

MIT License — Copyright (c) 2026 MATT ANIS. See [`LICENSE`](./LICENSE) for details.
