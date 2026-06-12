---
name: db-migration
description: Generate and apply a Drizzle migration after a schema change, the safe way. Use whenever packages/db/schema.ts changes — adding/altering tables, columns, enums, or indexes.
---

# Drizzle migration

Run this loop whenever the schema changes. Details in `.claude/rules/database-drizzle.md`.

## Steps

1. **Edit the schema** in `packages/db/schema.ts` (and `relations.ts` if relations change).
   Keep it consistent with `docs/04-modelo-dados.md` — update the doc if you intentionally
   diverge. Remember: snake_case columns, cuid2 ids, index every FK and filtered column.

2. **Generate** the SQL migration:

   ```
   npx drizzle-kit generate
   ```

   This writes a new migration under `./drizzle`.

3. **Review the generated SQL** before applying. Watch for:
   - `DROP COLUMN` / `DROP TABLE` / type changes → potential **data loss**. If a column has
     data, prefer an additive + backfill + remove sequence across migrations.
   - Enum changes (`ALTER TYPE ... ADD VALUE`) — additive only; you can't remove an enum value
     cleanly.
   - Missing indexes the schema declared.

4. **Apply** locally:

   ```
   npx drizzle-kit migrate
   ```

   (Postgres must be up — `docker compose up db`.)

5. **Commit the generated SQL** together with the schema change in the same commit. Never
   hand-edit a migration that has already been applied anywhere.

## Notes

- CI and deploy run `drizzle-kit migrate` as a **separate step** before the app starts.
- Use `npx drizzle-kit studio` to eyeball data locally (dev only).
- Don't write secrets or `DATABASE_URL` into tracked files — it comes from `.env` / CI secrets.
