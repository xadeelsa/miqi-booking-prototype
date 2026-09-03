# MIQI Booking — Prototype

A prototype booking system for **MIQI Huiswerkbegeleiding**, demonstrating the core booking flow and the proposed technical approach. Built as a single Next.js (App Router) application with PostgreSQL.

> Prototype scope: mocked payment, email, and calendar integrations. Fictitious data only.

## Status

Work in progress — see the milestone commit history.

## Tech stack

- **Next.js (App Router) + TypeScript** — one full-stack app (UI + server logic). No separate backend, deliberately (see _Architecture_).
- **PostgreSQL + Prisma** — relational data + a database-enforced anti-double-booking guarantee.
- **Zod** — server-side validation.
- **Vitest** — automated tests (run against a real Postgres).
- **Tailwind CSS** — responsive UI.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure the database
cp .env.example .env        # then edit DATABASE_URL

# 3. Set up the schema + seed fictitious data
npm run db:migrate
npm run db:seed

# 4. Run
npm run dev                 # http://localhost:3000
```

Requires a running PostgreSQL instance (local or Docker).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the test suite (needs Postgres) |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed fictitious services, slots, prices |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Architecture

_TODO (M9): short architecture overview — the Laravel/FastAPI-vs-monolith decision, the anti-double-booking mechanism, request flow._

## Limitations & next steps

_TODO (M9)._

## AI usage statement

_TODO (M9)._
