import { mkdir } from "node:fs/promises";
import { getServerEnv } from "@audova/shared";
import { getDb } from "@audova/db";
import { getSttProvider } from "@audova/stt";
import { claimNextJob, failJob } from "./queue";
import { runJob } from "./pipeline";

/**
 * Worker loop — DB-polling queue (MVP). Claims one job at a time, runs the pipeline, and on
 * failure requeues (up to MAX_ATTEMPTS) or marks FAILED. See .claude/rules/stt-and-pipeline.md
 */

const IDLE_POLL_MS = 2000;

async function main(): Promise<void> {
  const env = getServerEnv();
  const db = getDb(env.DATABASE_URL);
  const stt = getSttProvider(env.STT_PROVIDER);
  await mkdir(env.AUDIO_TMP_DIR, { recursive: true });

  console.log(
    `[worker] up · stt=${stt.name} · audioTmp=${env.AUDIO_TMP_DIR} · env=${env.NODE_ENV}`,
  );

  let running = true;
  const shutdown = (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down`);
    running = false;
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  while (running) {
    let job = null;
    try {
      job = await claimNextJob(db);
    } catch (err) {
      console.error("[worker] failed to claim job", err);
      await sleep(IDLE_POLL_MS);
      continue;
    }

    if (!job) {
      await sleep(IDLE_POLL_MS);
      continue;
    }

    console.log(
      `[worker] job ${job.id} claimed (video=${job.youtubeVideoId}, attempt ${job.attempts})`,
    );
    try {
      await runJob(db, stt, job, env.AUDIO_TMP_DIR);
      console.log(`[worker] job ${job.id} done`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[worker] job ${job.id} failed: ${message}`);
      await failJob(db, job.id, job.attempts, message).catch((e) =>
        console.error("[worker] failJob error", e),
      );
    }
  }

  process.exit(0);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
