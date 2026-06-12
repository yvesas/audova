import { getServerEnv } from "@audova/shared";
import { getSttProvider } from "@audova/stt";

/**
 * Worker entrypoint — Phase 0 skeleton. It boots, validates env, and selects the STT engine.
 * The real pipeline (captions → yt-dlp → ffmpeg → chunk → STT → persist) lands in Phase 1.
 * See .claude/rules/stt-and-pipeline.md
 */

const POLL_INTERVAL_MS = 2000;

async function tick(): Promise<void> {
  // Phase 1: claim a QUEUED job, run the pipeline, update status/progress, charge quota on
  // success, delete temp audio in a finally. For now this is a heartbeat only.
}

async function main(): Promise<void> {
  const env = getServerEnv();
  const stt = getSttProvider(env.STT_PROVIDER);
  console.log(
    `[worker] up · stt=${stt.name} · maxFileBytes=${stt.maxFileBytes} · env=${env.NODE_ENV}`,
  );

  let running = true;
  const shutdown = (signal: string) => {
    console.log(`[worker] received ${signal}, shutting down`);
    running = false;
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  while (running) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick error", err);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
