import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseVtt, type TranscriptSegment } from "@audova/shared";
import { run } from "../lib/exec";

/** Canonical watch URL from a validated videoId — we never pass the raw user string to yt-dlp. */
export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export interface VideoMetadata {
  title: string | null;
  channel: string | null;
  durationSec: number | null;
}

export async function fetchMetadata(videoId: string): Promise<VideoMetadata> {
  const { stdout } = await run("yt-dlp", [
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    watchUrl(videoId),
  ]);
  const data = JSON.parse(stdout) as {
    title?: string;
    uploader?: string;
    channel?: string;
    duration?: number;
  };
  return {
    title: data.title ?? null,
    channel: data.channel ?? data.uploader ?? null,
    durationSec: typeof data.duration === "number" ? Math.round(data.duration) : null,
  };
}

/** Preferred caption languages, in order. yt-dlp patterns match e.g. `pt`, `pt-BR`, `pt-orig`. */
const CAPTION_LANGS = "pt.*,pt,en.*,en";

export interface CaptionsResult {
  segments: TranscriptSegment[];
  language: string;
}

/**
 * The cost lever: try existing captions (manual or auto) before paying for STT. Returns null when
 * the video has no usable captions, in which case the caller falls back to Whisper.
 */
export async function fetchCaptions(
  videoId: string,
  workDir: string,
): Promise<CaptionsResult | null> {
  await run("yt-dlp", [
    "--skip-download",
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    CAPTION_LANGS,
    "--sub-format",
    "vtt",
    "--convert-subs",
    "vtt",
    "--no-warnings",
    "-o",
    join(workDir, "cap.%(ext)s"),
    watchUrl(videoId),
  ]).catch(() => undefined); // no captions is not an error

  const files = (await readdir(workDir)).filter((f) => f.endsWith(".vtt"));
  if (files.length === 0) return null;

  // Pick by language preference (pt before en), else the first available.
  const pick =
    files.find((f) => /\.pt[.-]?/i.test(f)) ?? files.find((f) => /\.en[.-]?/i.test(f)) ?? files[0]!;
  const langMatch = /cap\.([A-Za-z-]+)\.vtt$/.exec(pick);
  const content = await readFile(join(workDir, pick), "utf8");
  const segments = parseVtt(content);
  if (segments.length === 0) return null;

  return { segments, language: langMatch?.[1] ?? "unknown" };
}

/** Download the best audio-only stream. Returns the path to the downloaded file. */
export async function downloadAudio(videoId: string, workDir: string): Promise<string> {
  await run("yt-dlp", [
    "-f",
    "bestaudio",
    "--no-playlist",
    "--no-warnings",
    "-o",
    join(workDir, "audio.%(ext)s"),
    watchUrl(videoId),
  ]);
  const file = (await readdir(workDir)).find((f) => f.startsWith("audio."));
  if (!file) throw new Error("yt-dlp produced no audio file");
  return join(workDir, file);
}
