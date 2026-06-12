import type { SttProvider, TranscribeOptions, TranscriptResult } from "../types";

/**
 * Self-hosted Whisper via the optional faster-whisper sidecar (LOCAL_WHISPER_URL).
 * The cost ceiling: if volume explodes, STT_PROVIDER=local zeroes the per-minute cost.
 * STUB — real HTTP call lands later. Larger limit since it's local.
 */
export class LocalWhisperProvider implements SttProvider {
  readonly name = "local";
  readonly maxFileBytes = 200 * 1024 * 1024;

  async transcribe(_audioPath: string, _opts?: TranscribeOptions): Promise<TranscriptResult> {
    throw new Error("LocalWhisperProvider.transcribe not implemented yet.");
  }
}
