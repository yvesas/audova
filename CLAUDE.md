# Audova — Engineering Guide for Claude

Audova is a **YouTube-to-text transcription product built for studying**: paste a link →
get clean text with timestamps and export. The wedge is a **genuinely generous free tier**
(no card, no forced sign-up) against competitors that gate transcription behind paywalls.

The full product thinking lives in [`docs/`](./docs) (PT-BR). Read `docs/00-visao.md` for the
"why" and `docs/03-arquitetura.md` for the "how". This file is the day-to-day engineering
contract; the `.claude/rules/*` files hold the detail.

## Current state

**Planning → scaffolding.** No application code exists yet. The next milestone is roadmap
**Phase 0** (skeleton up, Docker, green CI) then **Phase 1** (the transcription MVP).
See `docs/06-roadmap.md`. When you scaffold, follow the structure below.

## Stack (decided — do not re-litigate)

- **Web:** Next.js 15 (App Router) + React 19 + TypeScript (`strict`) + Tailwind + shadcn/ui.
- **Data:** PostgreSQL + **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`). Not Prisma.
- **Jobs:** a separate **worker** process. DB-polling queue for the MVP; BullMQ + Redis later.
- **STT:** **Groq Whisper** by default, behind a swappable `SttProvider` interface (env-selected).
- **Media:** `yt-dlp` + `ffmpeg` (installed in the worker container only).
- **Auth:** NextAuth (Auth.js) — magic link + Google, **optional** (anonymous use is first-class).
- **Packaging:** Docker Compose. **CI:** GitHub Actions. Package manager: **npm** (workspaces).

## Repository structure (monorepo, npm workspaces)

```
audova/
├─ apps/
│  ├─ web/                 # Next.js (UI + API / Server Actions)
│  └─ worker/              # Node process consuming the job queue
├─ packages/
│  ├─ stt/                 # SttProvider interface + providers (groq | openai | local)
│  ├─ db/                  # Drizzle schema + shared client
│  └─ shared/              # shared types, zod validation, utils
├─ services/
│  └─ local-whisper/       # optional faster-whisper sidecar (compose profile)
├─ docs/                   # product docs (PT-BR) — source of truth for intent
├─ .claude/                # rules, agents, skills, hooks (this config)
├─ docker-compose.yml
└─ .github/workflows/ci.yml
```

Even before packages are split, the `SttProvider` interface must exist from day one
(`packages/stt`). Never inline a direct Groq call in the worker.

## Non-negotiable architecture rules

1. **STT is an abstraction.** The worker never knows which engine runs. Selecting an engine
   is one env var (`STT_PROVIDER=groq|openai|local`). New engine = new provider, nothing else.
2. **Captions first, Whisper second.** For YouTube, try existing captions (yt-dlp auto-sub)
   before paying for STT. This is the product's main cost lever — keep it intact.
3. **Long work lives in the worker, never in an HTTP request.** Routes/Server Actions only
   _enqueue_ a job and read status. Download + ffmpeg + STT happen in the worker.
4. **Audio is ephemeral.** Only text + metadata are persisted. Raw audio is deleted after the
   job completes (TTL ≤ 24h). Never store audio in the DB.
5. **Anonymous use is first-class.** Everything core must work with no login (quota by
   fingerprint). Login only buys more quota + history; never gate the core behind it.
6. **No dark patterns.** Quota is shown honestly. No silent charges, no fake urgency, no
   forced sign-up before delivering value. This posture _is_ the marketing — protect it.

## Conventions

- **TypeScript `strict`**, no `any`. Validate all external input (URLs, request bodies, env)
  with **zod** in `packages/shared`.
- **Naming:** files `kebab-case`; types/components `PascalCase`; vars/functions `camelCase`;
  DB columns `snake_case` (mapped via Drizzle), TS fields `camelCase`.
- **Errors:** user-facing messages are human and recoverable (PT-BR in the UI). Never leak
  stack traces or provider errors to the user.
- **Commits:** Conventional Commits. Work on a branch; open a PR. CI gates merge (lint +
  typecheck + test + build). Direct commits/pushes to `main` are blocked by a hook.
- **Secrets:** never write real values into tracked files. Placeholders go in `.env.example`;
  real values live in untracked `.env`. A hook blocks editing `.env*` (except `.env.example`).
- **i18n:** UI copy is PT-BR first, architected for EN later. Code, identifiers, comments,
  and these config files are in English.

## Commands (available after scaffold)

> These don't exist yet — wire them up in Phase 0, then keep this list accurate.

| Command                                 | Purpose                                     |
| --------------------------------------- | ------------------------------------------- |
| `docker compose up`                     | Bring up web + db (+ worker) for dev        |
| `npm run dev`                           | Run web locally                             |
| `npm run lint` / `npm run typecheck`    | Quality gates (also run by hooks)           |
| `npm run test` / `npm run build`        | Test + production build                     |
| `npx drizzle-kit generate` / `migrate`  | Create / apply DB migrations                |
| `docker compose --profile local-stt up` | Bring up the optional local Whisper sidecar |

## Detailed rules — read the relevant file before working in that area

| Area                                                    | File                                          |
| ------------------------------------------------------- | --------------------------------------------- |
| Monorepo layout, workspaces, where code goes            | `.claude/rules/stack-and-structure.md`        |
| TypeScript, naming, zod, error handling, git            | `.claude/rules/typescript-and-conventions.md` |
| Drizzle schema, migrations, data modeling               | `.claude/rules/database-drizzle.md`           |
| STT interface contract + worker pipeline                | `.claude/rules/stt-and-pipeline.md`           |
| URL validation, SSRF, rate limiting, LGPD, secrets      | `.claude/rules/security-and-privacy.md`       |
| Reading-first UI, palette, accessibility, quota honesty | `.claude/rules/ux-ui.md`                      |

## Out of scope for v1 (do not build unprompted)

AI study features (summary, flashcards, chat), mind maps, browser extension, meeting bots,
translation/dubbing. These are v2+. Keep the MVP to transcription + export.
