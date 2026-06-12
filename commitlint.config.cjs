/** Conventional Commits — see .claude/rules/typescript-and-conventions.md */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "refactor", "test", "perf", "build", "ci", "revert"],
    ],
  },
};
