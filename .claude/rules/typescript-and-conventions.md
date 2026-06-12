# Rule — TypeScript & Conventions

## TypeScript

- `strict: true`. No `any` (use `unknown` + narrowing). No non-null `!` to silence the
  compiler — fix the type.
- Prefer `type` for unions/shapes, `interface` for extendable contracts (e.g. `SttProvider`).
- Exhaustive `switch` on enums/discriminated unions with a `never` default (the STT factory
  already does this — mirror it).
- Validate **all** external input with **zod** at the boundary: request bodies, query params,
  the YouTube URL, and `process.env` (parse env once into a typed config object in
  `packages/shared`). Never trust a raw `process.env.X` deep in the code.

## Naming

| Thing                               | Style                                 | Example                          |
| ----------------------------------- | ------------------------------------- | -------------------------------- |
| Files / folders                     | kebab-case                            | `groq-provider.ts`               |
| Types, interfaces, React components | PascalCase                            | `TranscriptResult`, `ReaderView` |
| Variables, functions                | camelCase                             | `enqueueJob`                     |
| Constants                           | UPPER_SNAKE                           | `MAX_FILE_BYTES`                 |
| DB columns                          | snake_case (Drizzle), camelCase in TS | `source_url` ↔ `sourceUrl`       |
| Env vars                            | UPPER_SNAKE                           | `STT_PROVIDER`                   |

## Error handling

- User-facing errors are **human and recoverable**, in **PT-BR** (UI). Map internal failures to
  friendly messages: private video, no audio, quota exceeded, transient → "tente novamente".
- Never surface stack traces, provider errors, or internal IDs to the user.
- Worker jobs are **idempotent and retryable** (retry ≥ 2). A failed job must **not** consume
  the user's quota (charge quota only on success). See `stt-and-pipeline.md`.
- Log with structure (level, jobId, stage, provider) — not bare `console.log` strings.

## Git workflow

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Always work on a branch (`feat/<topic>`, `fix/<topic>`); open a PR. **Direct commit/push to
  `main` is blocked by a hook** — create a branch instead.
- CI gates merge: lint + typecheck + test + build + docker build must be green.
- Never commit secrets. `.env` is gitignored; only `.env.example` (placeholders) is tracked.
- Only commit or push when the user explicitly asks.

## Comments & style

- Match the surrounding code's density and idiom. Comment the _why_, not the _what_.
- Keep `packages/shared` pure: no side effects at import time, no framework/Node-only APIs.
