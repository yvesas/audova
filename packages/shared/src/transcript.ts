import type { TranscriptSegment } from "./types";

/** Format seconds as `m:ss` (or `h:mm:ss` past an hour). */
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Shift every segment's timestamps by offsetSec. Used after transcribing an audio chunk so its
 * times line up with the original timeline. THE classic pipeline bug lives here — keep it tested.
 */
export function applyOffset(segments: TranscriptSegment[], offsetSec: number): TranscriptSegment[] {
  if (offsetSec === 0) return segments.map((seg) => ({ ...seg }));
  return segments.map((seg) => ({
    start: seg.start + offsetSec,
    end: seg.end + offsetSec,
    text: seg.text,
  }));
}

/**
 * Merge per-chunk results (each already offset to the global timeline) into one ordered list,
 * re-indexed and sorted by start time.
 */
export function mergeSegmentBatches(batches: TranscriptSegment[][]): TranscriptSegment[] {
  return batches
    .flat()
    .slice()
    .sort((a, b) => a.start - b.start);
}

/**
 * Build readable full text from segments: group into paragraphs on long pauses so the reader
 * never sees a wall of text. `gapSec` is the silence that starts a new paragraph.
 */
export function buildFullText(segments: TranscriptSegment[], gapSec = 1.5): string {
  if (segments.length === 0) return "";
  const paragraphs: string[] = [];
  let current: string[] = [];
  let prevEnd: number | null = null;

  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;
    if (prevEnd !== null && seg.start - prevEnd > gapSec && current.length > 0) {
      paragraphs.push(current.join(" "));
      current = [];
    }
    current.push(text);
    prevEnd = seg.end;
  }
  if (current.length > 0) paragraphs.push(current.join(" "));
  return paragraphs.join("\n\n");
}

const VTT_TIME = /(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})/;

function vttTimeToSeconds(token: string): number | null {
  const m = VTT_TIME.exec(token);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const minutes = parseInt(m[2]!, 10);
  const seconds = parseInt(m[3]!, 10);
  const millis = parseInt(m[4]!, 10);
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/** Strip inline cue tags (`<00:00:01.000>`, `<c>`), then collapse whitespace. */
function cleanCueText(line: string): string {
  return line
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse a WebVTT subtitle file into segments. Handles HH:MM:SS.mmm and MM:SS.mmm timing, inline
 * tags, cue settings, and the rolling duplicates common in YouTube auto-captions.
 */
export function parseVtt(content: string): TranscriptSegment[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const segments: TranscriptSegment[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const arrowIdx = line.indexOf("-->");
    if (arrowIdx === -1) {
      i++;
      continue;
    }

    const start = vttTimeToSeconds(line.slice(0, arrowIdx));
    const end = vttTimeToSeconds(line.slice(arrowIdx + 3));
    i++;
    if (start === null || end === null) continue;

    const textParts: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() !== "") {
      const cleaned = cleanCueText(lines[i] ?? "");
      if (cleaned) textParts.push(cleaned);
      i++;
    }

    const text = textParts.join(" ").replace(/\s+/g, " ").trim();
    if (!text) continue;

    // Drop rolling duplicates: auto-captions repeat the previous line as context.
    const prev = segments[segments.length - 1];
    if (prev && prev.text === text) {
      prev.end = end;
      continue;
    }
    if (prev && text.startsWith(prev.text) && end > prev.start) {
      // a superset cue that extends the previous line — replace it
      prev.end = end;
      prev.text = text;
      continue;
    }

    segments.push({ start, end, text });
  }

  return segments;
}
