import { describe, expect, it } from "vitest";
import { getSttProvider } from "./index";

describe("getSttProvider", () => {
  it("returns the requested provider by name", () => {
    expect(getSttProvider("groq").name).toBe("groq");
    expect(getSttProvider("openai").name).toBe("openai");
    expect(getSttProvider("local").name).toBe("local");
  });

  it("defaults to groq", () => {
    expect(getSttProvider(undefined).name).toBe("groq");
  });

  it("throws on an unknown provider", () => {
    expect(() => getSttProvider("nope")).toThrow(/Invalid STT_PROVIDER/);
  });

  it("exposes a size limit used by the chunker", () => {
    expect(getSttProvider("groq").maxFileBytes).toBeGreaterThan(0);
  });
});
