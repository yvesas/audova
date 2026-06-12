"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { JobStatus } from "@audova/shared";
import { ReaderView, type TranscriptDTO } from "./reader-view";

interface StatusDTO {
  status: JobStatus;
  progress: number;
  error: string | null;
  videoId: string | null;
  transcript: TranscriptDTO | null;
}

const LABELS: Record<JobStatus, string> = {
  QUEUED: "Na fila…",
  FETCHING: "Buscando o vídeo…",
  EXTRACTING: "Extraindo o áudio…",
  TRANSCRIBING: "Transcrevendo…",
  FINALIZING: "Finalizando…",
  DONE: "Pronto",
  FAILED: "Falhou",
};

export function JobView({ jobId }: { jobId: string }) {
  const [state, setState] = useState<StatusDTO | null>(null);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("status fetch failed");
        const data = (await res.json()) as StatusDTO;
        if (!active) return;
        setState(data);
        setReconnecting(false);
        if (data.status !== "DONE" && data.status !== "FAILED") {
          timer = setTimeout(poll, 1500);
        }
      } catch {
        if (!active) return;
        setReconnecting(true);
        timer = setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [jobId]);

  if (state?.status === "DONE" && state.transcript) {
    return <ReaderView transcript={state.transcript} />;
  }

  if (state?.status === "FAILED") {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-lg font-medium">Não consegui transcrever esse vídeo.</p>
        <p className="mt-2 text-sm text-muted">
          Ele pode ser privado, sem áudio ou indisponível. Tente outro link.
        </p>
        <Link href="/" className="mt-6 inline-block text-accent hover:underline">
          Tentar outro link
        </Link>
      </div>
    );
  }

  const progress = state?.progress ?? 0;
  const label = state ? LABELS[state.status] : "Carregando…";

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-lg font-medium">{label}</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p className="mt-2 text-sm text-muted">{progress}%</p>
      {reconnecting && <p className="mt-2 text-xs text-warning">Reconectando…</p>}
    </div>
  );
}
