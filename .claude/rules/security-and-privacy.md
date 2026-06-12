# Rule — Security & Privacy

Audova ingests user-supplied URLs and runs media tooling on a server. Treat every input as
hostile. See `docs/02-requisitos.md` (RNF-06/07) and `docs/03-arquitetura.md`.

## URL ingestion / SSRF

- **Strict allowlist.** Only accept YouTube URLs. Validate the host against a regex allowlist
  and extract the `videoId`; reject anything else with a clear error. Never fetch an arbitrary
  user-supplied URL server-side.
- `yt-dlp` runs **only against validated YouTube videoIds**, never a raw URL string passed
  straight through.
- File uploads (later): validate MIME + extension + size before processing; treat the file as
  untrusted input to ffmpeg.

## Rate limiting & abuse

- Rate-limit **before enqueuing** a job, by IP + fingerprint (anonymous users have no account).
- Enforce per-job size/duration caps according to the caller's tier (quota).
- Anonymous quota is keyed by a `fingerprint` (cookie + device signals). It's a deterrent, not
  a guarantee — combine with IP rate limits.

## Secrets

- Real secret values **never** go into tracked files. Placeholders live in `.env.example`;
  real values in untracked `.env`. A hook blocks the assistant from editing `.env*`
  (except `.env.example`) and from leaking obvious keys into diffs.
- Sensitive keys: `GROQ_API_KEY`, `OPENAI_API_KEY`, `NEXTAUTH_SECRET`, Google OAuth,
  `DATABASE_URL`. In CI/CD these come from GitHub Secrets / Environments.
- Do not log secret values or full request bodies that may contain tokens.

## Privacy / LGPD

- **Audio is ephemeral.** Delete the temporary audio after the job; never persist it. Only
  text + metadata survive (TTL on the temp volume ≤ 24h as a backstop).
- A user can **delete a transcript** and **delete their account** — both must cascade and
  actually remove the data (the schema uses `onDelete: cascade`).
- Don't resell or repurpose user data. Transcripts belong to the user.
- Public share links (later) are **opt-in** only; nothing is public by default.

## General

- Validate and narrow all input with zod at the boundary (see `typescript-and-conventions.md`).
- Prefer parameterized Drizzle queries; never build SQL by string concatenation.
- Keep dependencies that run on untrusted input (yt-dlp, ffmpeg) confined to the worker
  container, running as a non-root user.
