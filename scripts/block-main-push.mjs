#!/usr/bin/env node
// pre-push guard: refuse to push from main/master. Mirrors the assistant's protect-main-branch
// hook so humans also work on feature branches + PRs (docs/08-devops-ci-cd.md).
import { execSync } from "node:child_process";

let branch = "";
try {
  branch = execSync("git symbolic-ref --short HEAD", { encoding: "utf8" }).trim();
} catch {
  process.exit(0); // detached HEAD or no branch — let git handle it
}

if (/^(main|master)$/.test(branch)) {
  console.error(
    `\n✖ Push blocked: you are on "${branch}". Don't push directly to the protected branch.\n` +
      "   Create a feature branch and open a PR:\n" +
      "     git switch -c feat/<topic>\n" +
      "     git push -u origin feat/<topic>\n\n" +
      "   CI gates the merge — see docs/08-devops-ci-cd.md\n",
  );
  process.exit(1);
}
process.exit(0);
