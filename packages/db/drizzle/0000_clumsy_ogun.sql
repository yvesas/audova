CREATE TYPE "public"."job_status" AS ENUM('QUEUED', 'FETCHING', 'EXTRACTING', 'TRANSCRIBING', 'FINALIZING', 'DONE', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('FREE', 'PRO');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('YOUTUBE', 'UPLOAD', 'AUDIO_URL');--> statement-breakpoint
CREATE TABLE "anon_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "anon_sessions_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"transcript_id" text,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_transcript_id_unique" UNIQUE("transcript_id")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_email" text,
	"referee_id" text,
	"rewarded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"id" text PRIMARY KEY NOT NULL,
	"transcript_id" text NOT NULL,
	"idx" integer NOT NULL,
	"start_sec" real NOT NULL,
	"end_sec" real NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_tags" (
	"transcript_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "transcript_tags_transcript_id_tag_id_pk" PRIMARY KEY("transcript_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"anon_session_id" text,
	"source_type" "source_type" NOT NULL,
	"source_url" text,
	"youtube_video_id" text,
	"title" text,
	"channel" text,
	"duration_sec" integer,
	"language" text,
	"full_text" text NOT NULL,
	"stt_provider" text NOT NULL,
	"used_captions" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"anon_session_id" text,
	"minutes" real NOT NULL,
	"transcript_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"name" text,
	"image" text,
	"plan" "plan" DEFAULT 'FREE' NOT NULL,
	"referral_code" text,
	"referred_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_tags" ADD CONSTRAINT "transcript_tags_transcript_id_transcripts_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcripts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_tags" ADD CONSTRAINT "transcript_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_anon_session_id_anon_sessions_id_fk" FOREIGN KEY ("anon_session_id") REFERENCES "public"."anon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_anon_session_id_anon_sessions_id_fk" FOREIGN KEY ("anon_session_id") REFERENCES "public"."anon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "segments_transcript_idx" ON "segments" USING btree ("transcript_id","idx");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_uq" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "transcripts_user_idx" ON "transcripts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transcripts_anon_idx" ON "transcripts" USING btree ("anon_session_id");--> statement-breakpoint
CREATE INDEX "transcripts_video_idx" ON "transcripts" USING btree ("youtube_video_id");--> statement-breakpoint
CREATE INDEX "usage_user_idx" ON "usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "usage_anon_idx" ON "usage_events" USING btree ("anon_session_id","created_at");