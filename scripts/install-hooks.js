#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const hooksDir = path.resolve(__dirname, "..", "git-hooks");

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

// Ensure the hook is executable — git silently skips non-executable hooks on
// macOS/Linux. No-op on Windows.
try {
  execFileSync("chmod", ["+x", path.join(hooksDir, "pre-push")]);
} catch {
  /* chmod may be unavailable on Windows — ignore */
}

try {
  execFileSync("git", ["config", "core.hooksPath", "git-hooks"], { stdio: "inherit" });
  console.log("✓ git hooks installed (core.hooksPath = git-hooks)");
  console.log("  pre-push now runs `npm run env:check` and reminds you to run `npm run env:push`.");
  console.log("  (Re-run `npm run hooks:install` after cloning the repo.)");
} catch (err) {
  console.error("✗ could not configure git hooks:", err.message);
  process.exit(1);
}
