#!/usr/bin/env node
// Stop: run `tsc --noEmit` when finishing a turn; if it fails, keep Claude working.
// No-op until the project has TypeScript installed (planning phase).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {}

  // Avoid loops: if we already blocked once this turn, let it stop.
  if (input?.stop_hook_active) process.exit(0);

  const dir = process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd();
  const pkgPath = join(dir, "package.json");

  // Planning-phase guard: do nothing until the project has deps installed.
  if (!existsSync(pkgPath) || !existsSync(join(dir, "node_modules"))) {
    process.exit(0);
  }

  // Prefer the workspace-aware `npm run typecheck`; fall back to local tsc.
  let cmd, args;
  let hasScript = false;
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    hasScript = Boolean(pkg?.scripts?.typecheck);
  } catch {}
  if (hasScript) {
    cmd = "npm";
    args = ["run", "typecheck"];
  } else {
    const tsc = join(dir, "node_modules", ".bin", "tsc");
    if (!existsSync(tsc)) process.exit(0);
    cmd = tsc;
    args = ["--noEmit"];
  }

  try {
    execFileSync(cmd, args, { cwd: dir, stdio: "pipe" });
    process.exit(0);
  } catch (e) {
    const out = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
    const lines = out.split("\n").filter(Boolean).slice(0, 40).join("\n");
    process.stderr.write(`Typecheck failed (tsc --noEmit) — fix these before finishing:\n${lines}`);
    process.exit(2); // block stop so Claude addresses the type errors
  }
});
