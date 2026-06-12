# Audova

YouTube-to-text transcription built for studying. Paste a link → clean text with timestamps and
export. Generously free, no forced sign-up.

Product docs (PT-BR) live in [`docs/`](./docs). Engineering rules for contributors and the AI
assistant live in [`CLAUDE.md`](./CLAUDE.md) and [`.claude/rules/`](./.claude/rules).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Drizzle ORM + Postgres ·
separate worker · Groq Whisper behind a swappable `SttProvider` · Docker · GitHub Actions CI.

Monorepo (npm workspaces): `apps/web`, `apps/worker`, `packages/{stt,db,shared}`.

## Getting started

```bash
nvm use                 # Node 20
npm install             # installs workspaces + sets up Husky hooks
cp .env.example .env     # then fill in values (GROQ_API_KEY, etc.)
```

### Run with Docker

```bash
docker compose up --build     # web on http://localhost:3000 + worker + postgres
```

### Run locally (without Docker for the apps)

```bash
docker compose up -d db       # just Postgres
npm run db:migrate            # apply Drizzle migrations
npm run dev                   # web on http://localhost:3000
npm run worker:dev            # the worker (separate terminal)
```

## Common scripts

| Command                                               | What it does                         |
| ----------------------------------------------------- | ------------------------------------ |
| `npm run dev` / `npm run worker:dev`                  | Run web / worker in watch mode       |
| `npm run lint` / `npm run typecheck` / `npm run test` | Quality gates (also run by hooks/CI) |
| `npm run build`                                       | Production build of all workspaces   |
| `npm run db:generate` / `db:migrate` / `db:studio`    | Drizzle migration workflow           |
| `docker compose --profile local-stt up`               | Optional self-hosted Whisper sidecar |

## Conventions & enforcement

- Work on a branch; open a PR. **Direct commit/push to `main` is blocked** (Husky + assistant hook).
- Conventional Commits enforced by `commitlint` (commit-msg hook).
- Staged files are auto-formatted/linted on commit (`lint-staged`).
- Secrets never get committed (`.env*` blocked except `.env.example`).
- CI must be green (lint + typecheck + test + build + docker build) to merge.

See [`CLAUDE.md`](./CLAUDE.md) for the full engineering contract.
