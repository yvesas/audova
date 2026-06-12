/**
 * The STT abstraction. The worker depends ONLY on these types — never on a concrete provider.
 * Adding an engine = a new file in providers/ + one case in the factory + a test. Nothing else.
 * See .claude/rules/stt-and-pipeline.md
 */

export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

export interface TranscriptResult {
  language: string;
  segments: TranscriptSegment[];
  fullText: string;
  provider: string; // "groq" | "openai" | "local"
  durationSec: number;
}

export interface TranscribeOptions {
  language?: string; // force language; otherwise auto-detect
  prompt?: string; // optional vocabulary/context
}

export interface SttProvider {
  readonly name: string;
  /** Transcribe an already-normalized audio file that is within maxFileBytes. */
  transcribe(audioPath: string, opts?: TranscribeOptions): Promise<TranscriptResult>;
  /** Per-call size limit, used by the chunker to split large audio. */
  readonly maxFileBytes: number;
}
