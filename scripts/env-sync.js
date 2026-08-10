#!/usr/bin/env node
"use strict";

// Keep local .env files in sync with .env.example and the CI manifest.
//   env:sync          add missing keys
//   env:sync --prune  also drop keys no longer in .env.example
//   env:check         exit 1 when out of sync (CI + pre-push hook)
// Never overwrites existing values — only adds missing keys.

const fs = require("fs");
const path = require("path");
const { readIfExists, parseEnv, detectEol, keysInOrder, getVars } = require("./env-utils");

const ROOT = path.resolve(__dirname, "..");

const EXAMPLES = [
  { app: "server", file: path.join(ROOT, "server", ".env.example") },
  { app: "client", file: path.join(ROOT, "client", ".env.example") },
];

const MANIFEST = path.join(ROOT, "scripts", "env-manifest.json");

// First sibling with a value wins, so "set it once, synced everywhere" works.
const TARGETS = [
  { file: "server/.env", example: "server/.env.example", siblings: ["server/.env.production", "server/.env.local"] },
  { file: "server/.env.local", example: "server/.env.example", siblings: ["server/.env", "server/.env.production"] },
  { file: "server/.env.production", example: "server/.env.example", siblings: ["server/.env", "server/.env.local"] },
  { file: "client/.env", example: "client/.env.example", siblings: ["client/.env.production", "client/.env.development"] },
  { file: "client/.env.development", example: "client/.env.example", siblings: ["client/.env", "client/.env.production"] },
  { file: "client/.env.production", example: "client/.env.example", siblings: ["client/.env", "client/.env.development"] },
].map((t) => ({
  ...t,
  abs: path.join(ROOT, t.file),
  exampleAbs: path.join(ROOT, t.example),
  siblingsAbs: t.siblings.map((s) => path.join(ROOT, s)),
}));

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const PRUNE = args.includes("--prune");
const DRY_RUN = args.includes("--dry-run");
const HELP = args.includes("--help");

const color = (code, text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = (t) => color(32, t);
const yellow = (t) => color(33, t);
const red = (t) => color(31, t);
const dim = (t) => color(2, t);

function printUsage() {
  console.log(`
env-sync — keep local .env files in sync with .env.example

  npm run env:sync             add example keys missing from local env files
  npm run env:sync -- --prune  also remove keys that left .env.example
  npm run env:check            verify sync (exit 1 when drift found)
  npm run env:sync -- --dry-run  preview changes without writing

Files synced (each vs its own .env.example):
${TARGETS.map((t) => `  - ${t.file}`).join("\n")}

The script NEVER overwrites existing values. Missing keys are filled from the
first sibling file that defines them, otherwise left empty for you to set.
`);
}

function syncFile(target, { check, prune, dryRun }) {
  const content = readIfExists(target.abs);
  if (content === null) {
    console.log(dim(`  • ${target.file}: not present, skipped`));
    return { needsSync: false };
  }

  const exampleKeys = keysInOrder(target.exampleAbs);
  const lines = parseEnv(content);
  const existing = new Set(lines.filter((l) => l.isKey).map((l) => l.key));

  const siblingsVars = target.siblingsAbs.map((abs, i) => ({
    file: target.siblings[i],
    vars: getVars(abs),
  }));

  const missing = exampleKeys.filter((k) => !existing.has(k));
  const additions = missing.map((key) => {
    let value = "";
    let source = null;
    for (const sib of siblingsVars) {
      if (sib.vars.has(key) && sib.vars.get(key) !== "") {
        value = sib.vars.get(key);
        source = sib.file;
        break;
      }
    }
    return { key, value, source };
  });

  const stale = [...existing].filter((k) => !exampleKeys.includes(k));
  // --check only fails on missing keys; --prune removes stale ones.
  const toRemove = check ? [] : prune ? stale : [];

  if (additions.length === 0 && toRemove.length === 0) {
    console.log(`  • ${target.file}: ${green("ok")}`);
    if (stale.length) {
      console.log(dim(`    stale keys (kept — use --prune to remove): ${stale.join(", ")}`));
    }
    return { needsSync: false };
  }

  if (check) {
    console.log(`  • ${target.file}: ${yellow("NEEDS SYNC")}`);
  } else if (dryRun) {
    console.log(
      `  • ${target.file}: would update ${yellow(`(+${additions.length} keys${toRemove.length ? `, -${toRemove.length} pruned` : ""})`)}`
    );
  } else {
    // Preserve the original line-ending style.
    const eol = detectEol(content);
    const crlf = eol === "\r\n" ? "\r" : "";
    const parts = lines
      .filter((l) => !(l.isKey && toRemove.includes(l.key)))
      .map((l) => l.raw);
    if (parts.length && parts[parts.length - 1] === "") parts.pop();
    if (additions.length) {
      if (parts.length) parts.push("");
      parts.push(`# --- added by \`npm run env:sync\` (keys present in .env.example) ---${crlf}`);
      for (const a of additions) parts.push(`${a.key}=${a.value}${crlf}`);
    }
    let out = parts.join("\n");
    if (additions.length || content.endsWith("\n")) {
      out = out.replace(/\r?\n?$/, "") + eol;
    }
    fs.writeFileSync(target.abs, out);
    console.log(
      `  • ${target.file}: ${green(`updated (+${additions.length} keys${toRemove.length ? `, -${toRemove.length} pruned` : ""})`)}`
    );
  }

  for (const a of additions) {
    console.log(
      a.source
        ? `      + ${a.key} ${dim(`(value copied from ${a.source})`)}`
        : `      + ${a.key} ${yellow("(empty — set the value manually)")}`
    );
  }
  if (toRemove.length) {
    console.log(`      - ${toRemove.join(", ")} ${dim("(removed — no longer in .env.example)")}`);
  }

  return { needsSync: true };
}

function currentManifestKeys() {
  const out = {};
  for (const e of EXAMPLES) out[e.app] = keysInOrder(e.file);
  return out;
}

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    return null;
  }
}

// Key order matters — it's part of the contract, so reordering flags a stale manifest.
function isManifestEqual(m1, m2) {
  if (!m1) return false;
  for (const e of EXAMPLES) {
    if (!Array.isArray(m1[e.app])) return false;
    if (m1[e.app].join("\n") !== m2[e.app].join("\n")) return false;
  }
  return true;
}

function syncManifest({ check, dryRun }) {
  const current = currentManifestKeys();
  const prev = readManifest();

  if (isManifestEqual(prev, current)) {
    console.log(`  • ${path.relative(ROOT, MANIFEST)}: ${green("ok")}`);
    return true;
  }

  if (check) {
    console.log(
      `  • ${path.relative(ROOT, MANIFEST)}: ${yellow("STALE")} (run \`npm run env:sync\` to regenerate)`
    );
  } else if (dryRun) {
    console.log(`  • ${path.relative(ROOT, MANIFEST)}: would regenerate`);
  } else {
    fs.writeFileSync(MANIFEST, JSON.stringify(current, null, 2) + "\n");
    console.log(`  • ${path.relative(ROOT, MANIFEST)}: ${green("regenerated")}`);
  }
  return false;
}

function main() {
  if (HELP) {
    printUsage();
    return;
  }

  console.log("env-sync — checking local env files against .env.example\n");

  let needsSync = false;
  for (const target of TARGETS) {
    const { needsSync: n } = syncFile(target, { check: CHECK, prune: PRUNE, dryRun: DRY_RUN });
    if (n) needsSync = true;
  }

  console.log();
  if (!syncManifest({ check: CHECK, dryRun: DRY_RUN })) needsSync = true;

  if (CHECK) {
    console.log();
    if (needsSync) {
      console.log(
        red(`✗ Out of sync — run \`npm run env:sync\` and commit scripts/env-manifest.json.`)
      );
      process.exit(1);
    }
    console.log(green("✓ All env files are in sync with .env.example."));
  } else if (DRY_RUN) {
    console.log();
    console.log(dim("(dry run — no files were written)"));
  } else {
    console.log();
    console.log(green("✓ done. Env files now match .env.example (values untouched)."));
  }
}

main();
