import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { jobs, type Database } from "@audova/db";
import type { JobStatus } from "@audova/shared";

export interface ClaimedJob {
  id: string;
  userId: string | null;
  anonSessionId: string | null;
  sourceType: string;
  sourceUrl: string | null;
  youtubeVideoId: string | null;
  language: string | null;
  forceWhisper: boolean;
  attempts: number;
}

export const MAX_ATTEMPTS = 3;

/**
 * Atomically claim the oldest QUEUED job and move it to FETCHING. `FOR UPDATE SKIP LOCKED` lets
 * multiple workers run safely without grabbing the same job. Returns null when the queue is empty.
 */
export async function claimNextJob(db: Database): Promise<ClaimedJob | null> {
  const result = await db.execute(sql`
    UPDATE jobs SET status = 'FETCHING', attempts = attempts + 1, updated_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'QUEUED'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, user_id, anon_session_id, source_type, source_url,
              youtube_video_id, language, force_whisper, attempts;
  `);

  const row = (result.rows ?? [])[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  return {
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    anonSessionId: (row.anon_session_id as string | null) ?? null,
    sourceType: row.source_type as string,
    sourceUrl: (row.source_url as string | null) ?? null,
    youtubeVideoId: (row.youtube_video_id as string | null) ?? null,
    language: (row.language as string | null) ?? null,
    forceWhisper: Boolean(row.force_whisper),
    attempts: Number(row.attempts),
  };
}

export async function setProgress(
  db: Database,
  jobId: string,
  patch: { status?: JobStatus; progress?: number },
): Promise<void> {
  await db
    .update(jobs)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

export async function completeJob(
  db: Database,
  jobId: string,
  transcriptId: string,
): Promise<void> {
  await db
    .update(jobs)
    .set({ status: "DONE", progress: 100, transcriptId, error: null, updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

/** On failure: requeue for another attempt, or mark FAILED once attempts are exhausted. */
export async function failJob(
  db: Database,
  jobId: string,
  attempts: number,
  message: string,
): Promise<void> {
  const exhausted = attempts >= MAX_ATTEMPTS;
  await db
    .update(jobs)
    .set({
      status: exhausted ? "FAILED" : "QUEUED",
      error: message.slice(0, 1000),
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));
}
