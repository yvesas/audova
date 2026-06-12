"use client";

import { useActionState } from "react";
import { createJob, type CreateJobState } from "@/lib/actions";
import { cn } from "@/lib/utils";

const initial: CreateJobState = {};

export function UrlForm() {
  const [state, formAction, pending] = useActionState(createJob, initial);

  return (
    <form action={formAction} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="url"
          type="url"
          inputMode="url"
          required
          placeholder="https://youtube.com/watch?v=..."
          aria-label="Link do YouTube"
          aria-invalid={state.error ? true : undefined}
          className={cn(
            "h-12 flex-1 rounded-xl border bg-surface px-4 text-base outline-none",
            "border-border focus-visible:ring-2 focus-visible:ring-accent",
            state.error && "border-danger focus-visible:ring-danger",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "h-12 rounded-xl px-6 text-base font-medium text-white",
            "bg-accent hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {pending ? "Enviando…" : "Transcrever"}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-left text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
