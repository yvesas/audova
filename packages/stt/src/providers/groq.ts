import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { SttProvider, TranscribeOptions, TranscriptResult } from "../types";

export interface GroqProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  /** Injectable for testing; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

interface GroqVerboseResponse {
  text?: string;
  language?: string;
  duration?: number;
  segments?: Array<{ start: number; end: number; text: string }>;
}

/**
 * Default engine: Groq Whisper (whisper-large-v3-turbo) via the OpenAI-compatible endpoint.
 * Per-call limit ~25 MB → the worker's chunker keeps files under maxFileBytes.
 * The API key is the provider's concern; it is not read deep elsewhere in the code.
 */
export class GroqWhisperProvider implements SttProvider {
  readonly name = "groq";
  readonly maxFileBytes = 25 * 1024 * 1024;

  private readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: GroqProviderOptions = {}) {
    this.model = opts.model ?? "whisper-large-v3-turbo";
    this.baseUrl = opts.baseUrl ?? "https://api.groq.com/openai/v1";
    this.apiKey = opts.apiKey;
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  }

  async transcribe(audioPath: string, opts?: TranscribeOptions): Promise<TranscriptResult> {
    const apiKey = this.apiKey ?? process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not set");

    const bytes = await readFile(audioPath);
    const form = new FormData();
    form.append("file", new Blob([bytes]), basename(audioPath));
    form.append("model", this.model);
    form.append("response_format", "verbose_json");
    if (opts?.language) form.append("language", opts.language);
    if (opts?.prompt) form.append("prompt", opts.prompt);

    const res = await this.fetchImpl(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Groq transcription failed (${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = (await res.json()) as GroqVerboseResponse;
    const segments = (data.segments ?? []).map((s) => ({
      start: s.start,
      end: s.end,
      text: s.text.trim(),
    }));
    const fullText = data.text?.trim() ?? segments.map((s) => s.text).join(" ");
    const durationSec = data.duration ?? segments.at(-1)?.end ?? 0;

    return {
      language: data.language ?? opts?.language ?? "unknown",
      segments,
      fullText,
      provider: this.name,
      durationSec,
    };
  }
}
