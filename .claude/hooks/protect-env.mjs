#!/usr/bin/env node
// PreToolUse(Edit|Write): block the assistant from writing real secret files.
// Allows .env.example / .env.sample / .env.template (placeholders only).
import { basename } from "node:path";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {}
  const fp = input?.tool_input?.file_path || "";
  const name = basename(fp);

  const isEnvFile = /^\.env($|\.)/.test(name);
  const isPlaceholder = /^\.env\.(example|sample|template|dist)$/.test(name);

  if (isEnvFile && !isPlaceholder) {
    process.stderr.write(
      `Blocked: editing "${name}" is not allowed. The assistant must never write secret ` +
        `values into env files. Add placeholder keys to .env.example instead, and have the ` +
        `user set real values in an untracked .env. See .claude/rules/security-and-privacy.md.`,
    );
    process.exit(2); // block the tool call
  }
  process.exit(0);
});
