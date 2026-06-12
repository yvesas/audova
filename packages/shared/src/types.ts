/** Shared domain types used across web, worker and packages. */

export type Plan = "FREE" | "PRO";

export type SourceType = "YOUTUBE" | "UPLOAD" | "AUDIO_URL";

export type JobStatus =
  | "QUEUED"
  | "FETCHING"
  | "EXTRACTING"
  | "TRANSCRIBING"
  | "FINALIZING"
  | "DONE"
  | "FAILED";

/** A transcript segment with timestamps in seconds. */
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}
