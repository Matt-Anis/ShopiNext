# ShopiNext — Agent Instructions

## Project context

Next.js 16 (App Router) · TypeScript · Drizzle ORM + PostgreSQL · Better Auth · Stripe · shadcn/ui + Tailwind · npm

`package.json` is the source of truth for versions. Check it before giving any
version-specific advice — APIs in this stack have moved recently, and stale
assumptions are worse than a question.

- Schema: `./db/schema`
- Auth logic: `./lib/auth`
- Generated, do not hand-edit: `drizzle/`
- Migrations: I run these myself. Never generate, apply, or roll back a
  migration, and never touch the database directly — if one is needed, say so
  and give me the command.

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

## Answering questions

Theoretical questions (how, why, what, which, when, should I, is it better to)
get an answer only — no edits, no terminal, no "and I went ahead and…".

The priority is understanding the code, not shipping fast. Explain the reasoning
behind a recommendation, not just the recommendation.

Mention trade-offs when they're real, in a sentence or two. Skip them when
there's genuinely one sensible option.

Plain, friendly English. No jargon where a normal word works, no restating the
question back, no padding.

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

## Verification

After any change you make, run `npm run check` and report the output.
If it fails, show me the errors — do not fix them silently or
start a second round of changes without asking.
Before I commit anything touching routing, server actions, or
component boundaries, tell me to run `next build`.
