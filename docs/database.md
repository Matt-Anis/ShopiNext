# Database

## Migrating superuser naming constraint

Migrations run as a Postgres superuser (see [`docker-compose.yml`](../docker-compose.yml)
/ root `.env.local`). That role's name must never match a schema name in
[`packages/db`](../packages/db) (currently `public`, `admin`) — Postgres's default
`search_path` is `"$user", public`, so a role named e.g. `admin` silently
shadows the `public` schema for any unqualified `CREATE TABLE`, routing new
tables into the wrong schema.

## Setting app role passwords

`client_app` and `admin_app` (see [`drizzle/0010_create_app_roles.sql`](../drizzle/0010_create_app_roles.sql)) are
created with `LOGIN` but no password — that file is git-tracked, so passwords
are set out of band, once per environment.

**Dev (Docker):**
```
docker exec -i store_db psql -U postgres -d store -c "ALTER ROLE admin_app WITH PASSWORD '<password>';"
docker exec -i store_db psql -U postgres -d store -c "ALTER ROLE client_app WITH PASSWORD '<password>';"
```

**Prod:** run directly against the database (e.g. via your provider's SQL console):
```sql
ALTER ROLE admin_app WITH PASSWORD '<password>';
ALTER ROLE client_app WITH PASSWORD '<password>';
```

Then point each app's `DATABASE_URL` at its own role:
- `apps/admin/.env.local` → `postgresql://admin_app:<password>@<host>:<port>/<db>`
- `apps/client/.env.local` → `postgresql://client_app:<password>@<host>:<port>/<db>`

The root `.env.local` (used only for running migrations) should keep using
the database superuser — `admin_app`/`client_app` don't have `CREATE`/`ALTER`
privileges.

## `isActive` is soft-delete, not draft/publish state

`isActive` on [`products`](../packages/db/public/schema/products.ts),
[`product_variants`](../packages/db/public/schema/variants.ts), and
[`categories`](../packages/db/public/schema/categories.ts) exists purely to
avoid hard-deleting rows that other data references — a hard `DELETE` on a
product or variant already sold would corrupt order history (an order line
pointing at a row that no longer exists), and a hard `DELETE` on a category
in use would silently lose which products had it. `isActive: false` means
"trashed," full stop.

It is **not** a draft/unpublished flag. Whether a product is still being
assembled through the admin creation wizard (no categories/options/variants
yet) is tracked separately via `products.status` (`draft` / `active`) —
conflating the two would mean an admin can't tell "deleted" from "still being
created" apart, and a soft-deleted row could never be distinguished from an
in-progress draft. Client-facing queries that read products must check both
`isActive = true` and `status = 'active'` — they're independent gates, not
interchangeable.

## Derived `products.minPrice`

Since pricing moved from a single `products.price` column to per-variant
prices on `product_variants`, the storefront needs "the" price to show and
sort by. That's the cheapest **in-stock** variant — `stock = 0` variants are
excluded, so a product that's sold out at its cheapest option doesn't show
a misleadingly low price, and a product with zero in-stock variants at all
is treated as unlisted (`minPrice` is `null`, and listing queries filter
those out rather than showing a priceless card).

Rather than computing `min(price) where stock > 0` on every storefront read
(re-aggregating across every variant of every product, every page load,
every sort), that value is denormalized onto `products.minPrice` and kept
in sync by a trigger on `product_variants`
([`drizzle/0015_add_products_min_price_trigger.sql`](../drizzle/0015_add_products_min_price_trigger.sql),
function `sync_product_min_price`). The trigger recomputes and writes
`minPrice` on insert/update/delete of a variant's `price`, `stock`, or
`productId`. This moves the cost to the rare admin-side write instead of
the frequent storefront read, and keeps it correct no matter which app or
script writes to `product_variants` — no application code has to remember
to update it.

**Why a trigger and not app code:** `packages/db` is schema-only (no
runtime logic), and both the admin app and one-off scripts (seeding,
imports) can write to `product_variants` directly. Recomputing `minPrice`
in app code would mean duplicating that logic at every write site and
trusting all of them to stay in sync. A trigger enforces the invariant at
the one place every write has to pass through: the database itself.

**Why it needs a hand-written migration:** Drizzle's schema (`drizzle-orm`
/ `drizzle-kit`) only models tables, columns, indexes, and constraints —
there's nothing in [`packages/db/public/schema/products.ts`](../packages/db/public/schema/products.ts) for
`drizzle-kit generate` to diff a trigger from. The `minPrice` column and
its partial index (`products_minPrice_id_idx`, `WHERE minPrice IS NOT
NULL` — sold-out products are never queried by price, so they're not
worth indexing) come from the normal schema-diff migration
([`0014_glorious_boomer.sql`](../drizzle/0014_glorious_boomer.sql)). The trigger and function live in a
`drizzle-kit generate --custom` file ([`0015_...sql`](../drizzle/0015_add_products_min_price_trigger.sql)) instead, since that's
the only path for SQL that isn't a schema diff. If `minPrice`'s sync logic
ever needs to change, edit the trigger function directly (via a new
migration) — it won't be regenerated or touched by future `db:generate`
runs, since drizzle-kit has no awareness it exists.
