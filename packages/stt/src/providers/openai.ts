import type { SttProvider, TranscribeOptions, TranscriptResult } from "../types";

/**
 * OpenAI Whisper — same interface, different endpoint. Useful as a fallback/comparison.
 * STUB — real API call lands later.
 */
export class OpenAIWhisperProvider implements SttProvider {
  readonly name = "openai";
  readonly maxFileBytes = 25 * 1024 * 1024;

  async transcribe(_audioPath: string, _opts?: TranscribeOptions): Promise<TranscriptResult> {
    throw new Error("OpenAIWhisperProvider.transcribe not implemented yet.");
  }
}
