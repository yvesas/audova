import { execFile } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
}

/**
 * Run an external binary with array args (no shell — safe from injection). Throws with stderr on
 * a non-zero exit. All media tooling (yt-dlp, ffmpeg) goes through here.
 */
export function run(cmd: string, args: string[], timeoutMs = 10 * 60_000): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    execFile(
      cmd,
      args,
      { timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`${cmd} failed: ${stderr?.toString().slice(0, 500) || error.message}`));
          return;
        }
        resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
      },
    );
  });
}
