import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GroqWhisperProvider } from "./groq";

let dir: string;
let audioPath: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "groq-test-"));
  audioPath = join(dir, "clip.mp3");
  writeFileSync(audioPath, Buffer.from([0x49, 0x44, 0x33])); // dummy bytes
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("GroqWhisperProvider", () => {
  it("maps the verbose_json response to TranscriptResult", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        text: "olá mundo",
        language: "pt",
        duration: 5,
        segments: [
          { start: 0, end: 2, text: " olá " },
          { start: 2, end: 5, text: "mundo" },
        ],
      }),
    ) as unknown as typeof fetch;

    const provider = new GroqWhisperProvider({ apiKey: "test", fetchImpl });
    const result = await provider.transcribe(audioPath, { language: "pt" });

    expect(result.provider).toBe("groq");
    expect(result.language).toBe("pt");
    expect(result.durationSec).toBe(5);
    expect(result.segments).toEqual([
      { start: 0, end: 2, text: "olá" },
      { start: 2, end: 5, text: "mundo" },
    ]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("throws a clear error when the API key is missing", async () => {
    const provider = new GroqWhisperProvider({ fetchImpl: vi.fn() as unknown as typeof fetch });
    const prev = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    await expect(provider.transcribe(audioPath)).rejects.toThrow(/GROQ_API_KEY/);
    if (prev !== undefined) process.env.GROQ_API_KEY = prev;
  });

  it("surfaces a non-OK response as an error", async () => {
    const fetchImpl = vi.fn(
      async () => new Response("rate limited", { status: 429 }),
    ) as unknown as typeof fetch;
    const provider = new GroqWhisperProvider({ apiKey: "test", fetchImpl });
    await expect(provider.transcribe(audioPath)).rejects.toThrow(/429/);
  });
});
