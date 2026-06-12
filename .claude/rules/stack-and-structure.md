# Rule — Stack & Repository Structure

Monorepo with **npm workspaces**. Read before adding a new package, moving code between
layers, or wiring a build.

## Workspace layout

```
apps/web        → Next.js app: UI, routes, Server Actions, auth, rate limiting, URL validation.
apps/worker     → long-running Node process: pulls jobs, runs the transcription pipeline.
packages/stt    → SttProvider interface + groq/openai/local providers + the chunker.
packages/db     → Drizzle schema, relations, migrations, the shared db client.
packages/shared → zod schemas, shared TS types, pure utils (no I/O, no framework imports).
services/local-whisper → optional faster-whisper sidecar (Docker compose profile only).
```

`package.json` at the root declares `"workspaces": ["apps/*", "packages/*"]`.

## Dependency direction (enforce — never violate)

- `apps/web` and `apps/worker` may depend on `packages/*`.
- `packages/*` **never** depend on `apps/*`.
- `packages/shared` depends on nothing internal (it is the leaf). No Next.js, no DB, no Node
  server APIs in `shared` — keep it isomorphic and trivially testable.
- Only `apps/worker` (and `packages/stt`) touch `yt-dlp` / `ffmpeg` / provider SDKs.
  `apps/web` must not import the STT providers or spawn media tools.

## Where things go (quick map)

| You're adding…                           | Put it in                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| A React component / page / Server Action | `apps/web`                                                   |
| Job-processing / media / pipeline step   | `apps/worker`                                                |
| A new STT engine                         | `packages/stt/providers/<name>.ts` + register in the factory |
| A DB table / column / query helper       | `packages/db`                                                |
| A zod schema or type used by >1 app      | `packages/shared`                                            |
| A one-off dev script                     | `apps/<x>/scripts` or root `scripts/`                        |

## Build & tooling

- TypeScript `strict` everywhere; a shared base `tsconfig` extended per workspace.
- ESLint + Prettier configured at the root; workspaces inherit.
- Next.js web image builds `output: 'standalone'`. Worker image installs `yt-dlp` + `ffmpeg`.
- Multi-stage Dockerfiles (deps → build → runtime), non-root runtime user.

## MVP pragmatism

If splitting all packages up front slows you down, it is acceptable to start with `stt`,
`db`, and `shared` as folders and formalize them as workspaces incrementally — **but the
`SttProvider` interface and the `db` schema must be real modules from day one**, never inlined.
