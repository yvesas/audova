import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getDb, jobs, transcripts, segments } from "@audova/db";

/** Status polling endpoint for the processing/reading screen. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
  if (!job) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let transcript = null;
  if (job.status === "DONE" && job.transcriptId) {
    const t = await db.query.transcripts.findFirst({
      where: eq(transcripts.id, job.transcriptId),
    });
    const segs = await db
      .select({
        startSec: segments.startSec,
        endSec: segments.endSec,
        text: segments.text,
      })
      .from(segments)
      .where(eq(segments.transcriptId, job.transcriptId))
      .orderBy(asc(segments.idx));

    if (t) {
      transcript = {
        title: t.title,
        channel: t.channel,
        youtubeVideoId: t.youtubeVideoId,
        durationSec: t.durationSec,
        usedCaptions: t.usedCaptions,
        fullText: t.fullText,
        segments: segs,
      };
    }
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    error: job.error,
    videoId: job.youtubeVideoId,
    transcript,
  });
}
