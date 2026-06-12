#!/usr/bin/env node
// pre-commit guard: refuse to commit real secret files. Mirrors the assistant's protect-env hook
// so the same rule binds human developers. Only .env.example (placeholders) may be tracked.
import { execSync } from "node:child_process";
import { basename } from "node:path";

let staged = [];
try {
  staged = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  process.exit(0);
}

const offenders = staged.filter((file) => {
  const name = basename(file);
  const isEnvFile = /^\.env($|\.)/.test(name);
  const isPlaceholder = /^\.env\.(example|sample|template|dist)$/.test(name);
  return isEnvFile && !isPlaceholder;
});

if (offenders.length) {
  console.error(
    "\n✖ Commit blocked: secret env files are not allowed in git:\n" +
      offenders.map((f) => `   - ${f}`).join("\n") +
      "\n\nKeep real values in an untracked .env. Only commit placeholders in .env.example.\n" +
      "See .claude/rules/security-and-privacy.md\n",
  );
  process.exit(1);
}
process.exit(0);
