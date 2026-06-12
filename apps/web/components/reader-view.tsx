"use client";

import { useState } from "react";
import Link from "next/link";
import { formatTimestamp } from "@audova/shared";
import { cn } from "@/lib/utils";

export interface TranscriptSegmentDTO {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscriptDTO {
  title: string | null;
  channel: string | null;
  youtubeVideoId: string | null;
  durationSec: number | null;
  usedCaptions: boolean;
  fullText: string;
  segments: TranscriptSegmentDTO[];
}

function youtubeAt(videoId: string, sec: number): string {
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(sec)}s`;
}

/** The reading screen: comfortable column, timestamp toggle, copy, clickable timestamps. */
export function ReaderView({ transcript }: { transcript: TranscriptDTO }) {
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    await navigator.clipboard.writeText(transcript.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-6 border-b border-border pb-4">
        <Link href="/" className="text-sm text-muted hover:text-fg">
          ‹ nova transcrição
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          {transcript.title ?? "Transcrição"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {[
            transcript.channel,
            transcript.durationSec ? formatTimestamp(transcript.durationSec) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          {transcript.usedCaptions ? " · via legendas ⚡" : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowTimestamps((v) => !v)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg"
          >
            {showTimestamps ? "Ocultar timestamps" : "Mostrar timestamps"}
          </button>
          <button
            onClick={copyAll}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-bg"
          >
            {copied ? "Copiado ✓" : "Copiar tudo"}
          </button>
        </div>
      </header>

      <article className="space-y-3 leading-relaxed">
        {transcript.segments.map((seg, i) => (
          <p key={i} className="flex gap-3">
            {showTimestamps && (
              <span className="shrink-0 select-none pt-0.5 font-mono text-xs text-muted">
                {transcript.youtubeVideoId ? (
                  <a
                    href={youtubeAt(transcript.youtubeVideoId, seg.startSec)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-accent"
                  >
                    {formatTimestamp(seg.startSec)}
                  </a>
                ) : (
                  formatTimestamp(seg.startSec)
                )}
              </span>
            )}
            <span className={cn(!showTimestamps && "block")}>{seg.text}</span>
          </p>
        ))}
      </article>
    </div>
  );
}
