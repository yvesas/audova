"use client";

import { useState, type FormEvent } from "react";
import { youTubeUrlSchema } from "@audova/shared";
import { cn } from "@/lib/utils";

/**
 * Phase 0: validates the YouTube URL client-side and shows the intended flow. Enqueuing a job
 * (Server Action → worker) lands in Phase 1.
 */
export function UrlForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAccepted(false);
    const result = youTubeUrlSchema.safeParse(url);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Link inválido.");
      return;
    }
    setError(null);
    setAccepted(true); // Phase 1 will enqueue the transcription job here.
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          aria-label="Link do YouTube"
          aria-invalid={error ? true : undefined}
          className={cn(
            "h-12 flex-1 rounded-xl border bg-surface px-4 text-base outline-none",
            "border-border focus-visible:ring-2 focus-visible:ring-accent",
            error && "border-danger focus-visible:ring-danger",
          )}
        />
        <button
          type="submit"
          className={cn(
            "h-12 rounded-xl px-6 text-base font-medium text-white",
            "bg-accent hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent",
          )}
        >
          Transcrever
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-left text-sm text-danger">
          {error}
        </p>
      )}
      {accepted && (
        <p role="status" className="mt-2 text-left text-sm text-success">
          Link válido ⚡ A transcrição entra na próxima fase (worker).
        </p>
      )}
    </form>
  );
}
