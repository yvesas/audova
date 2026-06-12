---
name: new-stt-provider
description: Scaffold a new STT engine that implements the SttProvider interface without touching the worker. Use when adding or stubbing a transcription engine (e.g. a new cloud STT, a self-hosted model). Keeps the engine abstraction intact.
---

# Add an STT provider

Goal: a new engine is **one new file + one factory case + one test** — nothing else changes.
This is the project's core invariant (`.claude/rules/stt-and-pipeline.md`).

## Steps

1. **Confirm the name** (lowercase, used as `STT_PROVIDER` value), e.g. `deepgram`.

2. **Create** `packages/stt/providers/<name>.ts` implementing `SttProvider`:
   - `readonly name = "<name>"`
   - `readonly maxFileBytes` — the engine's per-call size limit (the chunker relies on this).
   - `async transcribe(audioPath, opts?)` → returns a `TranscriptResult`
     (`{ language, segments, fullText, provider, durationSec }`). Assume the input file is
     already normalized and within `maxFileBytes`.
   - Read the API key / endpoint from the typed env config (zod-parsed), not raw `process.env`.
   - Map the engine's segment shape to `{ start, end, text }` in **seconds**.
   - Translate engine errors into clear internal errors (no user-facing leakage).

3. **Register** it in the factory `packages/stt/index.ts`: add a `case "<name>": return new
<Name>Provider();`. Keep the `default` `throw` exhaustive.

4. **Env:** add the needed vars (e.g. `<NAME>_API_KEY`, `<NAME>_URL`) to `.env.example` with
   placeholder values. Never put real keys in tracked files.

5. **Test** `packages/stt/providers/<name>.test.ts`: mock the HTTP/SDK call and assert the
   mapping to `TranscriptResult` (segment times in seconds, `provider` set correctly). If the
   engine has a size limit, assert `maxFileBytes` is honored.

6. **Do not** touch `apps/worker` or `apps/web`. If you need to, the abstraction has leaked —
   stop and fix the interface instead.

## Verify

- `npm run typecheck` and the new test pass.
- Switching `STT_PROVIDER=<name>` selects it with zero other code changes.
