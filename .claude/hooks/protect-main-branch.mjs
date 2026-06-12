#!/usr/bin/env node
// PreToolUse(Bash): block direct git commit/push on the main/master branch.
// Forces a feature-branch + PR workflow (docs/08-devops-ci-cd.md). No-op if no git repo yet.
import { readFileSync } from "node:fs";
import { join } from "node:path";

let raw = "";
process.stdin.on("data", (d) => (raw += d));
process.stdin.on("end", () => {
  let input = {};
  try {
    input = JSON.parse(raw || "{}");
  } catch {}
  const cmd = input?.tool_input?.command || "";

  const isCommit = /\bgit\s+commit\b/.test(cmd);
  const isPush = /\bgit\s+push\b/.test(cmd);
  if (!isCommit && !isPush) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input?.cwd || process.cwd();

  // Read current branch without spawning git.
  let branch = "";
  try {
    const head = readFileSync(join(projectDir, ".git", "HEAD"), "utf8").trim();
    const m = head.match(/^ref:\s*refs\/heads\/(.+)$/);
    branch = m ? m[1] : "";
  } catch {
    process.exit(0); // not a git repo (or detached) → nothing to protect
  }

  const onProtected = /^(main|master)$/.test(branch);
  const pushesToProtected = isPush && /\b(origin\s+)?(main|master)\b/.test(cmd);

  if ((isCommit && onProtected) || (isPush && (onProtected || pushesToProtected))) {
    const action = isCommit ? "commit on" : "push to";
    const target = pushesToProtected ? "main/master" : branch || "main";
    process.stderr.write(
      `Blocked: direct ${action} "${target}" is not allowed. ` +
        `Create a feature branch first (e.g. \`git switch -c feat/<topic>\`) and open a PR. ` +
        `CI gates the merge — see docs/08-devops-ci-cd.md.`,
    );
    process.exit(2);
  }
  process.exit(0);
});
