# Rule — STT Abstraction & Worker Pipeline

The single most important architectural invariant in Audova. Full rationale in
`docs/03-arquitetura.md`.

## The STT contract (`packages/stt`)

Every engine implements one interface. The worker depends on the **interface**, never a
concrete provider.

```ts
export interface SttProvider {
  readonly name: string; // "groq" | "openai" | "local"
  readonly maxFileBytes: number; // used by the chunker
  transcribe(audioPath: string, opts?: TranscribeOptions): Promise<TranscriptResult>;
}
```

`TranscriptResult` = `{ language, segments: {start,end,text}[], fullText, provider, durationSec }`.

Selection is by env via a factory:

```ts
export function getSttProvider(): SttProvider {
  switch (process.env.STT_PROVIDER ?? "groq") {
    case "groq":
      return new GroqWhisperProvider();
    case "openai":
      return new OpenAIWhisperProvider();
    case "local":
      return new LocalWhisperProvider(); // faster-whisper sidecar over HTTP
    default:
      throw new Error(`Invalid STT_PROVIDER: ${process.env.STT_PROVIDER}`);
  }
}
```

### Rules

- **Never** call Groq/OpenAI SDKs directly outside `packages/stt/providers/*`. The worker calls
  `getSttProvider().transcribe(...)` and nothing else.
- A provider receives an **already-normalized audio file that is within `maxFileBytes`**.
  Splitting large audio is the chunker's job, not the provider's.
- Adding an engine = a new file in `providers/` + one `case` in the factory + a test. No other
  file should change. If you find yourself touching the worker to add an engine, stop — the
  abstraction has leaked. Use the `/new-stt-provider` skill.

## Pipeline (worker) — order matters

```
1. Receive job { source: youtubeUrl | uploadedFile, options }.
2. If YouTube:
     a. Try official/auto captions (yt-dlp --write-auto-sub). If good → USE THEM, skip STT.
     b. Else download best audio (yt-dlp -f bestaudio).
3. Normalize with ffmpeg → mono, 16 kHz (shrinks size ~10×).
4. If file > provider.maxFileBytes → split into chunks by silence/time, recording each offset.
5. provider.transcribe() per chunk → segments.
6. Re-apply each chunk's time offset to its segments, then concatenate.
7. Post-process: punctuation/paragraphs, build fullText.
8. Persist Transcript + Segments; mark job done; emit final progress.
9. Delete the temporary audio.
```

- **Captions-first is mandatory** (the cost lever). Allow a flag to force Whisper, but the
  default path tries captions first. Record `usedCaptions` + `sttProvider` on the transcript.
- **Chunk offsets:** the #1 correctness bug here is timestamps that don't line up after
  concatenation. Each chunk's segments must be shifted by that chunk's start offset. Test this.

## Job status & progress

States: `QUEUED → FETCHING → EXTRACTING → TRANSCRIBING(%) → FINALIZING → DONE | FAILED`.
The UI **polls** job status (TanStack Query) for the MVP; SSE is a later optimization.

## Reliability

- Jobs are **idempotent** and **retryable** (≥ 2 attempts). Re-running a job must not duplicate
  transcripts or double-charge quota.
- Quota (`usageEvent`) is charged **only on success**. A failed/cancelled job costs the user
  nothing.
- Always delete temporary audio in a `finally`, even on failure (TTL ≤ 24h is the backstop).
