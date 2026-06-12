import { stat, readdir } from "node:fs/promises";
import { join } from "node:path";
import { run } from "../lib/exec";

export interface AudioChunk {
  path: string;
  offsetSec: number;
}

/** Normalize to mono 16 kHz MP3 — shrinks size ~10× and is well-supported by Whisper engines. */
export async function normalizeAudio(input: string, workDir: string): Promise<string> {
  const out = join(workDir, "norm.mp3");
  await run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "64k",
    out,
  ]);
  return out;
}

async function probeDurationSec(path: string): Promise<number> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const value = parseFloat(stdout.trim());
  return Number.isFinite(value) ? value : 0;
}

/**
 * Split audio into time-based chunks that stay under maxFileBytes, recording each chunk's offset
 * on the original timeline. The offset is what makes reassembled timestamps line up — see
 * applyOffset/mergeSegmentBatches in @audova/shared.
 */
export async function splitIntoChunks(
  path: string,
  workDir: string,
  maxFileBytes: number,
): Promise<AudioChunk[]> {
  const { size } = await stat(path);
  if (size <= maxFileBytes) return [{ path, offsetSec: 0 }];

  const durationSec = await probeDurationSec(path);
  if (durationSec <= 0) return [{ path, offsetSec: 0 }];

  // Estimate a safe chunk length from the byte rate, with headroom.
  const bytesPerSec = size / durationSec;
  const chunkSec = Math.max(30, Math.floor((maxFileBytes * 0.9) / bytesPerSec));

  await run("ffmpeg", [
    "-y",
    "-i",
    path,
    "-f",
    "segment",
    "-segment_time",
    String(chunkSec),
    "-c",
    "copy",
    join(workDir, "chunk_%03d.mp3"),
  ]);

  const files = (await readdir(workDir)).filter((f) => /^chunk_\d{3}\.mp3$/.test(f)).sort();
  if (files.length === 0) return [{ path, offsetSec: 0 }];

  return files.map((file, index) => ({
    path: join(workDir, file),
    offsetSec: index * chunkSec,
  }));
}
