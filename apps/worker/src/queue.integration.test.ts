import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import {
  getDb,
  endDb,
  anonSessions,
  jobs,
  transcripts,
  segments as segmentsTable,
  usageEvents,
  type Database,
} from "@audova/db";
import { claimNextJob, completeJob, failJob, setProgress, MAX_ATTEMPTS } from "./queue";

// Hits a real Postgres. Runs in CI (DATABASE_URL set + migrations applied); skipped otherwise.
const d = process.env.DATABASE_URL ? describe : describe.skip;

d("queue + persistence (integration)", () => {
  // Assigned in beforeAll so getDb() (which needs DATABASE_URL) isn't called when skipped.
  let db: Database;
  let anonId: string;

  beforeAll(async () => {
    db = getDb();
    const [a] = await db
      .insert(anonSessions)
      .values({ fingerprint: `smoke-${crypto.randomUUID()}` })
      .returning({ id: anonSessions.id });
    anonId = a!.id;
  });

  afterAll(async () => {
    // Cascades clean up the job/transcript/segments/usage tied to this session.
    await db.delete(anonSessions).where(eq(anonSessions.id, anonId));
    await endDb();
  });

  it("claims a QUEUED job atomically, runs it, and persists the result", async () => {
    const [created] = await db
      .insert(jobs)
      .values({
        anonSessionId: anonId,
        sourceType: "YOUTUBE",
        youtubeVideoId: "abcdef12345",
        sourceUrl: "https://youtube.com/watch?v=abcdef12345",
        status: "QUEUED",
      })
      .returning({ id: jobs.id });
    const jobId = created!.id;

    // claim → FETCHING, attempts incremented, fields carried through
    const claimed = await claimNextJob(db);
    expect(claimed?.id).toBe(jobId);
    expect(claimed?.youtubeVideoId).toBe("abcdef12345");
    expect(claimed?.anonSessionId).toBe(anonId);
    expect(claimed?.attempts).toBe(1);

    const afterClaim = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    expect(afterClaim?.status).toBe("FETCHING");

    await setProgress(db, jobId, { status: "TRANSCRIBING", progress: 40 });

    // persist transcript + segments + usage in one transaction (as the pipeline does)
    const transcriptId = await db.transaction(async (tx) => {
      const [t] = await tx
        .insert(transcripts)
        .values({
          anonSessionId: anonId,
          sourceType: "YOUTUBE",
          youtubeVideoId: "abcdef12345",
          title: "Smoke test",
          durationSec: 12,
          language: "pt",
          fullText: "linha um\n\nlinha dois",
          sttProvider: "youtube-captions",
          usedCaptions: true,
        })
        .returning({ id: transcripts.id });
      await tx.insert(segmentsTable).values([
        { transcriptId: t!.id, idx: 0, startSec: 0, endSec: 5, text: "linha um" },
        { transcriptId: t!.id, idx: 1, startSec: 6, endSec: 12, text: "linha dois" },
      ]);
      await tx.insert(usageEvents).values({
        anonSessionId: anonId,
        minutes: 12 / 60,
        transcriptId: t!.id,
      });
      return t!.id;
    });

    await completeJob(db, jobId, transcriptId);

    // job is DONE and linked
    const done = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    expect(done?.status).toBe("DONE");
    expect(done?.progress).toBe(100);
    expect(done?.transcriptId).toBe(transcriptId);

    // relational read returns ordered segments
    const stored = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, transcriptId),
      with: { segments: { orderBy: (s, { asc }) => [asc(s.idx)] } },
    });
    expect(stored?.usedCaptions).toBe(true);
    expect(stored?.segments.map((s) => s.text)).toEqual(["linha um", "linha dois"]);

    // usage recorded
    const usage = await db
      .select()
      .from(usageEvents)
      .where(eq(usageEvents.transcriptId, transcriptId));
    expect(usage).toHaveLength(1);
  });

  it("requeues on failure until attempts are exhausted, then marks FAILED", async () => {
    const [created] = await db
      .insert(jobs)
      .values({
        anonSessionId: anonId,
        sourceType: "YOUTUBE",
        youtubeVideoId: "zzzzzzzzzzz",
        status: "QUEUED",
      })
      .returning({ id: jobs.id });
    const jobId = created!.id;

    const first = await claimNextJob(db);
    expect(first?.id).toBe(jobId);
    expect(first?.attempts).toBe(1);

    // attempt 1 fails → requeued
    await failJob(db, jobId, first!.attempts, "boom");
    const requeued = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    expect(requeued?.status).toBe("QUEUED");

    // exhaust attempts → FAILED
    await failJob(db, jobId, MAX_ATTEMPTS, "boom again");
    const failed = await db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    expect(failed?.status).toBe("FAILED");
    expect(failed?.error).toContain("boom");
  });
});
