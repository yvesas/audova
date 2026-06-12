import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import {
  applyOffset,
  buildFullText,
  mergeSegmentBatches,
  type TranscriptSegment,
} from "@audova/shared";
import { segments as segmentsTable, transcripts, usageEvents, type Database } from "@audova/db";
import type { SttProvider } from "@audova/stt";
import { fetchCaptions, fetchMetadata, downloadAudio } from "./media/ytdlp";
import { normalizeAudio, splitIntoChunks } from "./media/ffmpeg";
import { completeJob, setProgress, type ClaimedJob } from "./queue";

interface FinalTranscript {
  segments: TranscriptSegment[];
  fullText: string;
  language: string | null;
  provider: string;
  usedCaptions: boolean;
  durationSec: number;
}

/** Persist transcript + segments + the usage event in one transaction (quota on success only). */
async function persist(
  db: Database,
  job: ClaimedJob,
  meta: { title: string | null; channel: string | null },
  result: FinalTranscript,
): Promise<string> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(transcripts)
      .values({
        userId: job.userId,
        anonSessionId: job.anonSessionId,
        sourceType: "YOUTUBE",
        sourceUrl: job.sourceUrl,
        youtubeVideoId: job.youtubeVideoId,
        title: meta.title,
        channel: meta.channel,
        durationSec: result.durationSec,
        language: result.language,
        fullText: result.fullText,
        sttProvider: result.provider,
        usedCaptions: result.usedCaptions,
      })
      .returning({ id: transcripts.id });

    const transcriptId = inserted!.id;

    if (result.segments.length > 0) {
      await tx.insert(segmentsTable).values(
        result.segments.map((seg, idx) => ({
          transcriptId,
          idx,
          startSec: seg.start,
          endSec: seg.end,
          text: seg.text,
        })),
      );
    }

    await tx.insert(usageEvents).values({
      userId: job.userId,
      anonSessionId: job.anonSessionId,
      minutes: result.durationSec / 60,
      transcriptId,
    });

    return transcriptId;
  });
}

/**
 * Run one job end to end. Temporary audio lives under a per-job work dir that is always removed
 * in `finally` — audio is ephemeral; only text + metadata persist.
 */
export async function runJob(
  db: Database,
  stt: SttProvider,
  job: ClaimedJob,
  audioTmpDir: string,
): Promise<void> {
  if (!job.youtubeVideoId) {
    throw new Error("job has no youtubeVideoId");
  }
  const videoId = job.youtubeVideoId;
  const workDir = await mkdtemp(join(audioTmpDir, `job-${job.id}-`));

  try {
    await setProgress(db, job.id, { status: "FETCHING", progress: 5 });
    const meta = await fetchMetadata(videoId);

    let segments: TranscriptSegment[] | null = null;
    let language: string | null = job.language;
    let provider = stt.name;
    let usedCaptions = false;

    // 1. Captions-first (the cost lever), unless the job forces Whisper.
    if (!job.forceWhisper) {
      const captions = await fetchCaptions(videoId, workDir);
      if (captions) {
        segments = captions.segments;
        language = language ?? captions.language;
        provider = "youtube-captions";
        usedCaptions = true;
      }
    }

    // 2. Fallback to STT.
    if (!segments) {
      await setProgress(db, job.id, { status: "EXTRACTING", progress: 20 });
      const raw = await downloadAudio(videoId, workDir);
      const normalized = await normalizeAudio(raw, workDir);
      const chunks = await splitIntoChunks(normalized, workDir, stt.maxFileBytes);

      await setProgress(db, job.id, { status: "TRANSCRIBING", progress: 40 });
      const batches: TranscriptSegment[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]!;
        const r = await stt.transcribe(chunk.path, { language: job.language ?? undefined });
        batches.push(applyOffset(r.segments, chunk.offsetSec));
        if (i === 0 && !language) language = r.language;
        const pct = 40 + Math.round(((i + 1) / chunks.length) * 50);
        await setProgress(db, job.id, { progress: pct });
      }
      segments = mergeSegmentBatches(batches);
      provider = stt.name;
    }

    // 3. Finalize + persist.
    await setProgress(db, job.id, { status: "FINALIZING", progress: 92 });
    const fullText = buildFullText(segments);
    const durationSec = meta.durationSec ?? Math.round(segments.at(-1)?.end ?? 0);

    const transcriptId = await persist(db, job, meta, {
      segments,
      fullText,
      language,
      provider,
      usedCaptions,
      durationSec,
    });

    await completeJob(db, job.id, transcriptId);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
