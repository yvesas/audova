import { z } from "zod";

/**
 * Strict YouTube URL parsing. The product NEVER fetches an arbitrary user-supplied URL
 * server-side (SSRF). We accept only known YouTube hosts and extract the videoId; everything
 * downstream (yt-dlp) is driven by the validated id, not the raw string.
 * See .claude/rules/security-and-privacy.md
 */

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Returns the 11-char videoId for a valid YouTube URL, or null otherwise. */
export function parseYouTubeUrl(input: string): { videoId: string } | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v");
  } else if (/^\/(embed|shorts|live|v)\//.test(url.pathname)) {
    candidate = url.pathname.split("/")[2] ?? null;
  }

  if (!candidate || !VIDEO_ID_RE.test(candidate)) return null;
  return { videoId: candidate };
}

export function isYouTubeUrl(input: string): boolean {
  return parseYouTubeUrl(input) !== null;
}

/** Zod schema for a YouTube URL that resolves to a videoId. */
export const youTubeUrlSchema = z
  .string()
  .trim()
  .min(1, "Cole um link do YouTube.")
  .refine(isYouTubeUrl, "Esse link do YouTube não é válido.");
