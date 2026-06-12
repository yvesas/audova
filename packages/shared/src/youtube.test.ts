import { describe, expect, it } from "vitest";
import { parseYouTubeUrl, isYouTubeUrl } from "./youtube";

describe("parseYouTubeUrl", () => {
  it("parses standard watch URLs", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      videoId: "dQw4w9WgXcQ",
    });
  });

  it("parses youtu.be short links", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({ videoId: "dQw4w9WgXcQ" });
  });

  it("parses shorts and embed paths", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.videoId).toBe(
      "dQw4w9WgXcQ",
    );
    expect(parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")?.videoId).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("rejects non-YouTube hosts (no SSRF)", () => {
    expect(parseYouTubeUrl("https://evil.example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeUrl("http://169.254.169.254/latest/meta-data")).toBeNull();
  });

  it("rejects malformed input and bad ids", () => {
    expect(parseYouTubeUrl("not a url")).toBeNull();
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(isYouTubeUrl("")).toBe(false);
  });
});
