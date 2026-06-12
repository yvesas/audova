#!/usr/bin/env node
// Strip any leading blank/whitespace (incl. a BOM, which JS \s matches) from the commit message
// before commitlint validates it. Pasting a multi-line message often introduces a leading
// newline, which makes commitlint read an empty header (type-empty/subject-empty/header-trim).
// This only removes leading whitespace — it never rewrites the actual type/subject.
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) process.exit(0);

try {
  const original = readFileSync(file, "utf8");
  const normalized = original.replace(/^\s+/, "");
  if (normalized !== original) writeFileSync(file, normalized);
} catch {
  // never block the commit on a normalization hiccup
}
process.exit(0);
