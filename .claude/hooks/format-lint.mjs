#!/usr/bin/env node
// PostToolUse(Edit|Write): auto-format + lint-fix the edited file.
// No-op until deps are installed (planning phase). Surfaces unfixable ESLint errors to Claude.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {}
  const fp = input?.tool_input?.file_path || "";
  if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(fp)) process.exit(0);

  const dir = process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd();
  const bin = (n) => join(dir, "node_modules", ".bin", n);

  // Planning-phase guard: do nothing until the project has dependencies installed.
  if (!existsSync(join(dir, "node_modules"))) process.exit(0);

  try {
    if (existsSync(bin("prettier"))) {
      execFileSync(bin("prettier"), ["--write", fp], { stdio: "ignore" });
    }
  } catch {
    // formatting is best-effort; never block on it
  }

  try {
    if (existsSync(bin("eslint"))) {
      execFileSync(bin("eslint"), ["--fix", fp], { stdio: "pipe" });
    }
  } catch (e) {
    const out = (e.stdout?.toString() || "") + (e.stderr?.toString() || "");
    process.stderr.write(
      `ESLint found issues in ${fp} that auto-fix couldn't resolve:\n${out.slice(0, 1500)}`,
    );
    process.exit(2); // show to Claude so it fixes them
  }
  process.exit(0);
});
