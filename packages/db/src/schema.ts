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

// ---- users (optional — anonymous use is first-class) ----
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  plan: planEnum("plan").notNull().default("FREE"),
  referralCode: text("referral_code").unique(),
  referredById: text("referred_by_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---- anonSessions (use without login) ----
export const anonSessions = pgTable("anon_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  fingerprint: text("fingerprint").notNull().unique(),
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
    // polymorphic owner: a logged-in user OR an anonymous session
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
    language: text("language"),
    fullText: text("full_text").notNull(),
    sttProvider: text("stt_provider").notNull(), // groq | openai | local | youtube-captions
    usedCaptions: boolean("used_captions").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("transcripts_user_idx").on(t.userId),
    index("transcripts_anon_idx").on(t.anonSessionId),
    index("transcripts_video_idx").on(t.youtubeVideoId),
  ],
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
    idx: integer("idx").notNull(),
    startSec: real("start_sec").notNull(),
    endSec: real("end_sec").notNull(),
    text: text("text").notNull(),
  },
  (t) => [index("segments_transcript_idx").on(t.transcriptId, t.idx)],
);

// ---- jobs (async processing) ----
export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    transcriptId: text("transcript_id")
      .unique()
      .references(() => transcripts.id, { onDelete: "set null" }),
    // owner carried from job creation → applied to the transcript + usage when it completes
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    anonSessionId: text("anon_session_id").references(() => anonSessions.id, {
      onDelete: "cascade",
    }),
    status: jobStatusEnum("status").notNull().default("QUEUED"),
    progress: integer("progress").notNull().default(0), // 0–100
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    sourceType: sourceTypeEnum("source_type").notNull().default("YOUTUBE"),
    sourceUrl: text("source_url"),
    youtubeVideoId: text("youtube_video_id"),
    language: text("language"), // forced input language, if any
    forceWhisper: boolean("force_whisper").notNull().default(false), // skip the captions shortcut
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("jobs_status_idx").on(t.status),
    index("jobs_user_idx").on(t.userId),
    index("jobs_anon_idx").on(t.anonSessionId),
  ],
);

// ---- usageEvents (quota) ----
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
    minutes: real("minutes").notNull(),
    transcriptId: text("transcript_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("usage_user_idx").on(t.userId, t.createdAt),
    index("usage_anon_idx").on(t.anonSessionId, t.createdAt),
  ],
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
  (t) => [uniqueIndex("tags_user_name_uq").on(t.userId, t.name)],
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
  (t) => [primaryKey({ columns: [t.transcriptId, t.tagId] })],
);

// ---- referrals ----
export const referrals = pgTable(
  "referrals",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    referrerId: text("referrer_id").notNull(),
    refereeEmail: text("referee_email"),
    refereeId: text("referee_id"),
    rewardedAt: timestamp("rewarded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("referrals_referrer_idx").on(t.referrerId)],
);
