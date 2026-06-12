import type { SttProvider, TranscribeOptions, TranscriptResult } from "../types";

/**
 * Default engine: Groq Whisper (whisper-large-v3 / -turbo). ~25 MB per-call limit → the chunker
 * keeps files under maxFileBytes. STUB — real API call lands in Phase 1.
 */
export class GroqWhisperProvider implements SttProvider {
  readonly name = "groq";
  readonly maxFileBytes = 25 * 1024 * 1024;

  async transcribe(_audioPath: string, _opts?: TranscribeOptions): Promise<TranscriptResult> {
    throw new Error("GroqWhisperProvider.transcribe not implemented yet (Phase 1).");
  }
}
