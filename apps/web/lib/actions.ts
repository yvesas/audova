"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { getDb, jobs } from "@audova/db";
import { parseYouTubeUrl, youTubeUrlSchema } from "@audova/shared";
import { getOrCreateAnonSession } from "./session";
import { getAnonQuota } from "./quota";

export interface CreateJobState {
  error?: string;
}

/** Validate the link, enforce anonymous quota, enqueue a job, and go to its page. */
export async function createJob(
  _prev: CreateJobState,
  formData: FormData,
): Promise<CreateJobState> {
  const url = String(formData.get("url") ?? "");

  const parsed = youTubeUrlSchema.safeParse(url);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Link inválido." };
  }
  const video = parseYouTubeUrl(url);
  if (!video) return { error: "Esse link do YouTube não é válido." };

  const anonSessionId = await getOrCreateAnonSession();

  const quota = await getAnonQuota(anonSessionId);
  if (quota.remainingMinutes <= 0) {
    return {
      error: "Você atingiu sua cota de hoje. Volte amanhã ou crie uma conta para ter mais.",
    };
  }

  const db = getDb();
  const [job] = await db
    .insert(jobs)
    .values({
      anonSessionId,
      sourceType: "YOUTUBE",
      sourceUrl: url,
      youtubeVideoId: video.videoId,
      status: "QUEUED",
    })
    .returning({ id: jobs.id });

  redirect(`/j/${job!.id}` as Route);
}
