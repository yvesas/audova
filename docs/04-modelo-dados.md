# 04 — Modelo de Dados

Banco: **PostgreSQL** via **Drizzle ORM** (`drizzle-orm` + `drizzle-kit` para migrations).
Por que Drizzle em vez de Prisma: mais leve (sem engine binária / sem `prisma generate`
pesado), SQL-first e totalmente type-safe, schema declarado em TypeScript puro, e migrations
geradas por `drizzle-kit`. Schema inicial pensado para a v1 (transcrição pura) e já preparado
para login opcional, cotas e indicação.

## Entidades

- **users** — opcional (uso anônimo é permitido). Quando existe, dá cota maior e histórico.
- **anonSessions** — identifica um visitante sem conta (fingerprint + cookie) para aplicar cota.
- **transcripts** — uma transcrição (a fonte, o resultado, metadados).
- **segments** — trechos com timestamp de um transcript.
- **jobs** — o processamento assíncrono que gerou (ou está gerando) um transcript.
- **usageEvents** — consumo de cota (minutos transcritos), para limites e analytics.
- **tags** / **transcriptTags** — organização (N:N).
- **referrals** — programa de indicação (doc 07).

## Schema Drizzle (rascunho) — `packages/db/schema.ts`

```ts
import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// ---- enums ----
export const planEnum = pgEnum("plan", ["FREE", "PRO"]);
export const sourceTypeEnum = pgEnum("source_type", ["YOUTUBE", "UPLOAD", "AUDIO_URL"]);
export const jobStatusEnum = pgEnum("job_status", [
  "QUEUED",
  "FETCHING",
  "EXTRACTING",
  "TRANSCRIBING",
  "FINALIZING",
  "DONE",
  "FAILED",
]);

// ---- users ----
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  plan: planEnum("plan").notNull().default("FREE"),
  referralCode: text("referral_code").unique(), // link de indicação
  referredById: text("referred_by_id"), // quem indicou este usuário
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---- anonSessions (uso sem login) ----
export const anonSessions = pgTable("anon_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fingerprint: text("fingerprint").notNull().unique(), // hash de cookie + sinais do device
  firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
});

// ---- transcripts ----
export const transcripts = pgTable(
  "transcripts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    // dono polimórfico: um usuário logado OU uma sessão anônima
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    anonSessionId: text("anon_session_id").references(() => anonSessions.id, {
      onDelete: "cascade",
    }),

    sourceType: sourceTypeEnum("source_type").notNull(),
    sourceUrl: text("source_url"),
    youtubeVideoId: text("youtube_video_id"),
    title: text("title"),
    channel: text("channel"),
    durationSec: integer("duration_sec"),
    language: text("language"), // detectado ou forçado
    fullText: text("full_text").notNull(),
    sttProvider: text("stt_provider").notNull(), // groq | openai | local | youtube-captions
    usedCaptions: boolean("used_captions").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("transcripts_user_idx").on(t.userId),
    anonIdx: index("transcripts_anon_idx").on(t.anonSessionId),
    videoIdx: index("transcripts_video_idx").on(t.youtubeVideoId),
  }),
);

// ---- segments (timestamps) ----
export const segments = pgTable(
  "segments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    transcriptId: text("transcript_id")
      .notNull()
      .references(() => transcripts.id, { onDelete: "cascade" }),
    idx: integer("idx").notNull(), // ordem
    startSec: real("start_sec").notNull(),
    endSec: real("end_sec").notNull(),
    text: text("text").notNull(),
  },
  (t) => ({
    byTranscript: index("segments_transcript_idx").on(t.transcriptId, t.idx),
  }),
);

// ---- jobs (processamento assíncrono) ----
export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    transcriptId: text("transcript_id")
      .unique()
      .references(() => transcripts.id, { onDelete: "set null" }),
    status: jobStatusEnum("status").notNull().default("QUEUED"),
    progress: integer("progress").notNull().default(0), // 0–100
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("jobs_status_idx").on(t.status),
  }),
);

// ---- usageEvents (cota) ----
export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    anonSessionId: text("anon_session_id").references(() => anonSessions.id, {
      onDelete: "cascade",
    }),
    minutes: real("minutes").notNull(), // minutos de áudio consumidos
    transcriptId: text("transcript_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userWindow: index("usage_user_idx").on(t.userId, t.createdAt),
    anonWindow: index("usage_anon_idx").on(t.anonSessionId, t.createdAt),
  }),
);

// ---- tags (N:N) ----
export const tags = pgTable(
  "tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => ({
    uniqByUser: uniqueIndex("tags_user_name_uq").on(t.userId, t.name),
  }),
);

export const transcriptTags = pgTable(
  "transcript_tags",
  {
    transcriptId: text("transcript_id")
      .notNull()
      .references(() => transcripts.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transcriptId, t.tagId] }),
  }),
);

// ---- referrals (indicação) ----
export const referrals = pgTable(
  "referrals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    referrerId: text("referrer_id").notNull(), // users.id que indicou
    refereeEmail: text("referee_email"),
    refereeId: text("referee_id"), // preenchido quando o convidado cria conta
    rewardedAt: timestamp("rewarded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    byReferrer: index("referrals_referrer_idx").on(t.referrerId),
  }),
);
```

> **Relations:** declarar com `relations()` do Drizzle (`drizzle-orm`) num arquivo
> `relations.ts` para habilitar a query relacional (`db.query.transcripts.findMany({ with: { segments: true } })`).
> Omitido aqui por brevidade.

## Notas de modelagem

- **Dono polimórfico (user OU anonSession):** suporta o uso anônimo sem login (RF-40).
  Quando o anônimo cria conta, migramos `transcripts`/`usageEvents` da `anonSession` para o `user`
  (um `UPDATE ... SET user_id = ?, anon_session_id = NULL`).
- **`usedCaptions` / `sttProvider`:** registram se a transcrição veio de legendas do YouTube
  (barato) ou de qual engine de STT — importante para custo e qualidade (doc 03/07).
- **Áudio não fica no banco.** Apenas texto e metadados. O arquivo de áudio é temporário em
  volume/objeto e apagado por TTL (RNF-06).
- **Cota** é calculada somando `usageEvents.minutes` na janela do plano (dia p/ anônimo, mês p/
  free) — ver regras no doc 07.
- **`fullText` + `segments`:** guardamos o texto completo (para busca/export rápido) e os
  segmentos (para timestamps e SRT). Redundância intencional e barata.
- **IDs:** `cuid2` via `$defaultFn` (poderia ser `uuid` do Postgres; cuid2 é curto e amigável em URL).

## Migrações & ferramentas

- **`drizzle-kit generate`** cria as migrations SQL a partir do schema TypeScript.
- **`drizzle-kit migrate`** (ou `migrate()` do `drizzle-orm` no boot) aplica em dev/CI/prod.
- **`drizzle-kit studio`** dá um GUI local para inspecionar os dados (equivalente ao Prisma Studio).
- Config em `drizzle.config.ts` (dialect `postgresql`, `schema`, `out: ./drizzle`).
- Seed: nenhum dado obrigatório; opcional criar um usuário de teste em dev via script `seed.ts`.
