# ShopiNext — Agent Instructions

## Project context

Turborepo monorepo · Next.js (App Router) · TypeScript · Drizzle ORM + PostgreSQL · Better Auth · Stripe · shadcn/ui + Tailwind · pnpm 11

`package.json` (root and per-app) is the source of truth for versions. Check it
before giving any version-specific advice — APIs in this stack have moved
recently, and stale assumptions are worse than a question.

---

## Monorepo structure

```
.github/workflows/          # CI/CD pipelines
apps/
  client/                   # Customer-facing Next.js app
    db/index.ts             # Imports and re-exports public schema only
    lib/auth.ts             # Better Auth config for client app
  admin/                    # Admin dashboard Next.js app
    db/index.ts             # Imports and re-exports public + admin schemas
    lib/auth.ts             # Better Auth config for admin app (separate accounts)
packages/
  db/                       # Schema definitions only — no runtime logic
    public/
      auth-schema.ts        # Better Auth tables for client (user, session, account…)
      schema.ts             # Public-facing domain tables
    admin/
      auth-schema.ts        # Better Auth tables for admin (separate accounts)
      schema.ts             # Admin-only domain tables
  ui/                       # Shared shadcn/ui component library
    components/             # All shared components live here
    lib/utils.ts
drizzle/                    # Migration output — do not hand-edit
  0010_create_app_roles.sql # Defines the two DB roles (see Database roles below)
drizzle.config.ts           # Single Drizzle config at root, targets both schemas
```

---

## Database

### Schemas
- `public` schema — client-facing tables + Better Auth tables for client accounts
- `admin` schema — admin-only tables + Better Auth tables for admin accounts

### Roles
Two least-privilege PostgreSQL roles are defined in `drizzle/0010_create_app_roles.sql`:

| Role         | Schema access      | Permissions                    |
|--------------|--------------------|--------------------------------|
| `client_app` | `public` only      | SELECT, INSERT, UPDATE, DELETE |
| `admin_app`  | `public` + `admin` | SELECT, INSERT, UPDATE, DELETE |

Neither role can ALTER or DROP tables — schema changes are migration-only.

### Migrations
- One Drizzle config at the root (`drizzle.config.ts`), migration output in `./drizzle/`
- **Never generate, apply, or roll back a migration, and never touch the database directly.**
- If a migration is needed, say so and provide the command for me to run.

---

## Auth

- Both apps use Better Auth independently — the accounts are completely separate.
- Client auth: `apps/client/lib/auth.ts` — uses tables in the `public` schema
- Admin auth: `apps/admin/lib/auth.ts` — uses tables in the `admin` schema
- Do not assume anything is shared between the two auth setups.

---

## Shared packages

- `packages/db` — schema only. Each app imports what it needs in its own `db/index.ts`.
  Do not add runtime logic here.
- `packages/ui` — shared shadcn/ui components. Add new components here, not inside apps.

---

## Build system

Turborepo with pnpm workspaces. The root `turbo.json` defines the task graph.
Standard tasks: `dev`, `build`, `lint`, `typecheck`, `check`, `test:e2e`.
DB tasks (`db:generate`, `db:migrate`, `db:studio`) run from the root via `drizzle-kit`.

---

## Autonomy

Never assume — ask. That covers both directions: don't guess what I want when a
request is ambiguous or has more than one reasonable reading, and don't guess
how something works when you could check it. If the answer is in the codebase or
the official docs, go read it. If it's a preference, ask me. A short question
beats a confident wrong answer.

Read, search, and analyze the codebase freely — no permission needed for that.
Do not write files, install packages, run commands, or change configuration
unless explicitly asked. When a change seems like a good idea, propose it and
wait.

Before running any terminal command, say what it does first.

---

## Answering questions

Theoretical questions (how, why, what, which, when, should I, is it better to)
get an answer only — no edits, no terminal, no "and I went ahead and…".

The priority is understanding the code, not shipping fast. Explain the reasoning
behind a recommendation, not just the recommendation.

Mention trade-offs when they're real, in a sentence or two. Skip them when
there's genuinely one sensible option.

Plain, friendly English. No jargon where a normal word works, no restating the
question back, no padding.

---

## Code conventions

Check whether a standard solution already exists before writing anything new —
in the codebase, in an installed dependency, or in the framework. If a
well-established library would solve it, mention that too, even if it isn't
installed yet. Either way: say what exists first, then ask before rolling a
custom version or installing anything.

Follow the approach the library's official docs recommend. Where docs and
training memory disagree, trust the docs.

Prefer the Drizzle query builder over raw SQL. Reach for `sql` only when the
builder can't express the query cleanly, and explain why when you do.

Components: shadcn/ui first, Base UI when a headless primitive is needed.

Commits: `type(scope): imperative summary`, ~72 chars, no trailing period.
Types: `feat` `fix` `refactor` `chore` `docs` `style` `test` `perf` `ci` `build` `revert`

---

## Verification

After any change you make, run `pnpm check` and report the output.
If it fails, show me the errors — do not fix them silently or
start a second round of changes without asking.

Before I commit anything touching routing, server actions, or
component boundaries, tell me to run `pnpm build`.
