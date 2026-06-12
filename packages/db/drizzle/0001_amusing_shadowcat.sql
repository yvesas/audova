ALTER TABLE "jobs" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "anon_session_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "source_type" "source_type" DEFAULT 'YOUTUBE' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "youtube_video_id" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "force_whisper" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_anon_session_id_anon_sessions_id_fk" FOREIGN KEY ("anon_session_id") REFERENCES "public"."anon_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_user_idx" ON "jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "jobs_anon_idx" ON "jobs" USING btree ("anon_session_id");