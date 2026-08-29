# Database

## Migrating superuser naming constraint

Migrations run as a Postgres superuser (see `docker-compose.yml` / root
`.env.local`). That role's name must never match a schema name in
`packages/db` (currently `public`, `admin`) — Postgres's default
`search_path` is `"$user", public`, so a role named e.g. `admin` silently
shadows the `public` schema for any unqualified `CREATE TABLE`, routing new
tables into the wrong schema.

## Setting app role passwords

`client_app` and `admin_app` (see `drizzle/0010_create_app_roles.sql`) are
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
