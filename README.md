# Marketing AI

An AI assistant that learns a client's business context and turns it into mechanical,
data-driven marketing. It runs a pipeline of bounded contexts —
**Discovery → Client Knowledge → Strategy → Experimentation** — backed by a
three-tier memory (working / episodic / semantic). Built with Next.js and the
Claude Agent SDK, with data persisted in PostgreSQL via Prisma.

See [`docs/data-flow.md`](./docs/data-flow.md) for how data moves through the app.

## Prerequisites

- **Node.js** 20+ and npm
- **Docker** (with Docker Compose) — used to run PostgreSQL locally
- A **Claude Code OAuth token** — the app authenticates the Claude Agent SDK with it
  (there is no Anthropic API key in this project)

## Setup

1. **Install dependencies.** This also generates the Prisma client.

   ```bash
   npm install
   ```

2. **Create your environment file.** Copy the example and fill in the values.

   ```bash
   cp .env.example .env
   ```

   You need two variables:

   - `DATABASE_URL` — already set in the example to point at the local Docker database.
   - `CLAUDE_CODE_OAUTH_TOKEN` — your Claude Code token, required for the AI agents to run.

3. **Start the database.** This launches PostgreSQL in Docker.

   ```bash
   npm run db:up
   ```

   > The database listens on host port **5433** (not the default 5432) so it won't
   > clash with any other Postgres you already run locally.

4. **Apply the database schema.** This creates all the tables.

   ```bash
   npm run db:migrate
   ```

## Running the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

When you're done, you can stop the database with `npm run db:down` (your data is kept).

## Testing

There are two test suites:

- **Unit tests** — fast, no database needed (they use in-memory test doubles):

  ```bash
  npm run test:ci
  ```

- **Integration tests** — exercise the real Prisma repositories against Postgres.
  The database must be running (`npm run db:up`) with migrations applied:

  ```bash
  npm run test:integration
  ```

Type-check the whole project with:

```bash
npx tsc --noEmit
```

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `npm start` | Production build / run |
| `npm run test:ci` | Run unit tests (no database) |
| `npm run test:integration` | Run integration tests (needs the database) |
| `npm run db:up` / `npm run db:down` | Start / stop the Postgres container |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:generate` | Regenerate the Prisma client after editing the schema |
| `npm run db:reset` | Drop and recreate the database (destructive) |
| `npm run db:studio` | Open Prisma Studio to browse the data |

## Project structure

- `src/domains/` — the bounded contexts (memory, conversation, client-knowledge,
  onboarding, strategy, experimentation), each with its aggregates, ports, and use cases.
- `src/data/` — the Prisma-backed repository implementations.
- `src/agents/` & `src/tools/` — the Claude Agent SDK agents and their tools.
- `src/app/api/` — the Next.js API routes.
- `prisma/` — the database schema and migration history.
- `docs/` — architecture docs: [context map](./docs/CONTEXT_MAP.md),
  [ubiquitous language](./docs/UBIQUITOUS_LANGUAGE.md),
  [data flow](./docs/data-flow.md), and [decision records](./docs/adr/).

## How it works (in one line)

A founder chats with the Discovery agent, which produces a structured business
profile. That profile feeds the Strategy phase (OKRs and an action plan), which
feeds the Experimentation phase (weekly testable experiments broken down into
daily shippable actions). Everything is remembered and persisted so the system
gets smarter the more it's used.
