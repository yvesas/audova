import { describe, expect, it } from "vitest";
import {
  applyOffset,
  buildFullText,
  formatTimestamp,
  mergeSegmentBatches,
  parseVtt,
} from "./transcript";

describe("formatTimestamp", () => {
  it("formats under an hour as m:ss", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(9)).toBe("0:09");
    expect(formatTimestamp(71)).toBe("1:11");
    expect(formatTimestamp(600)).toBe("10:00");
  });
  it("formats past an hour as h:mm:ss", () => {
    expect(formatTimestamp(3661)).toBe("1:01:01");
  });
});

describe("applyOffset", () => {
  it("shifts start and end by the offset", () => {
    const out = applyOffset([{ start: 0, end: 2, text: "a" }], 600);
    expect(out).toEqual([{ start: 600, end: 602, text: "a" }]);
  });
  it("is a no-op (but copies) at offset 0", () => {
    const input = [{ start: 1, end: 2, text: "a" }];
    const out = applyOffset(input, 0);
    expect(out).toEqual(input);
    expect(out[0]).not.toBe(input[0]);
  });
});

describe("mergeSegmentBatches — chunk reassembly", () => {
  it("concatenates offset chunks back into one ordered timeline", () => {
    const chunk0 = applyOffset(
      [
        { start: 0, end: 5, text: "one" },
        { start: 5, end: 10, text: "two" },
      ],
      0,
    );
    const chunk1 = applyOffset(
      [
        { start: 0, end: 4, text: "three" },
        { start: 4, end: 9, text: "four" },
      ],
      10, // second chunk starts at 10s on the global timeline
    );
    const merged = mergeSegmentBatches([chunk1, chunk0]); // intentionally out of order
    expect(merged.map((s) => s.text)).toEqual(["one", "two", "three", "four"]);
    expect(merged.map((s) => s.start)).toEqual([0, 5, 10, 14]);
  });
});

describe("buildFullText", () => {
  it("joins close segments and breaks paragraphs on long pauses", () => {
    const text = buildFullText([
      { start: 0, end: 2, text: "Frase um." },
      { start: 2.2, end: 4, text: "Frase dois." },
      { start: 8, end: 10, text: "Novo parágrafo." },
    ]);
    expect(text).toBe("Frase um. Frase dois.\n\nNovo parágrafo.");
  });
  it("returns empty string for no segments", () => {
    expect(buildFullText([])).toBe("");
  });
});

describe("parseVtt", () => {
  it("parses cues with HH:MM:SS.mmm timing and strips tags", () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:02.500
<00:00:00.000><c>Olá</c> mundo

00:00:02.500 --> 00:00:05.000
segunda linha`;
    expect(parseVtt(vtt)).toEqual([
      { start: 0, end: 2.5, text: "Olá mundo" },
      { start: 2.5, end: 5, text: "segunda linha" },
    ]);
  });

  it("collapses rolling auto-caption duplicates", () => {
    const vtt = `WEBVTT

00:00:00.000 --> 00:00:01.000
oi

00:00:01.000 --> 00:00:02.000
oi tudo bem`;
    const segs = parseVtt(vtt);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ start: 0, end: 2, text: "oi tudo bem" });
  });
});
