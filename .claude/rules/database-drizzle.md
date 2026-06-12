# Rule — Database & Drizzle

Postgres via **Drizzle ORM**. Canonical schema draft is in `docs/04-modelo-dados.md` — keep
the implementation in `packages/db/schema.ts` consistent with it (update the doc if you
intentionally diverge).

## Conventions

- Schema is declared in TypeScript in `packages/db/schema.ts`; relations in `relations.ts`.
- IDs: `cuid2` via `$defaultFn(() => createId())` (short, URL-friendly). Not auto-increment.
- Column names are `snake_case`; TS fields are `camelCase` (Drizzle maps them).
- Timestamps: `timestamp(...).notNull().defaultNow()`; keep `created_at` / `updated_at`.
- Index every foreign key and every column you filter/sort on (quota windows, job status,
  `youtube_video_id`). The doc already lists the needed indexes — honor them.
- Enums via `pgEnum` (`plan`, `source_type`, `job_status`). Extend the enum + a migration to
  add a value; never store free-form strings where an enum exists.

## Migrations workflow

1. Edit `packages/db/schema.ts`.
2. `npx drizzle-kit generate` → produces a SQL migration in `./drizzle`.
3. Review the generated SQL (especially drops / type changes — these can lose data).
4. `npx drizzle-kit migrate` to apply (also runs in CI and on deploy as a separate step).
5. **Commit the generated SQL** alongside the schema change. Never hand-edit applied migrations.

Use the `/db-migration` skill to run this loop consistently.

## Data-modeling rules specific to Audova

- **Polymorphic owner:** a transcript belongs to **either** a `user` **or** an `anonSession`
  (one of `user_id` / `anon_session_id` is set). When an anon user signs up, migrate their
  rows: `UPDATE ... SET user_id = ?, anon_session_id = NULL`.
- **No audio in the DB.** Persist only `fullText`, `segments`, and metadata. Raw audio stays on
  an ephemeral volume with a TTL and is deleted post-job.
- **Keep `fullText` + `segments` both.** `fullText` for fast search/export; `segments` for
  timestamps and SRT. The redundancy is intentional and cheap.
- **Quota is derived**, not a counter: sum `usageEvents.minutes` over the plan window (day for
  anon, month for free). Charge a `usageEvent` only when a job **succeeds**.
- **Provenance:** set `usedCaptions` and `sttProvider` on every transcript (`groq` | `openai` |
  `local` | `youtube-captions`) — these drive cost analytics and the captions-first lever.

## Drizzle Studio

`npx drizzle-kit studio` for a local GUI to inspect data. Dev only.
