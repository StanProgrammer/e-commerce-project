#!/usr/bin/env node
"use strict";

// Push local env files to Render + Vercel so you never touch the dashboards.
//   env:push              sync both providers
//   env:push --deploy     also trigger a Render deploy
//   env:push --dry-run    preview without sending
// Credentials come from .env.push (see .env.push.example) or real env vars.
// Values are never printed in full — only masked.

const path = require("path");
const { readIfExists, parseEnv, getVars, maskSecret } = require("./env-utils");

const ROOT = path.resolve(__dirname, "..");
const RENDER_API = "https://api.render.com";
const VERCEL_API = "https://api.vercel.com";

const TARGETS = [
  { name: "render", label: "Render", envFile: path.join(ROOT, "server", ".env.production") },
  { name: "vercel", label: "Vercel", envFile: path.join(ROOT, "client", ".env.production") },
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const PRUNE = args.includes("--prune");
const DEPLOY = args.includes("--deploy");
const HELP = args.includes("--help");
const onlyArg = args.find((a) => a.startsWith("--only=") || a.startsWith("--target="));
const only = onlyArg ? onlyArg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean) : null;

const color = (code, text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = (t) => color(32, t);
const yellow = (t) => color(33, t);
const red = (t) => color(31, t);
const dim = (t) => color(2, t);

// Load credentials from .env.push, overlaid with real env vars.
function loadCredentials() {
  const creds = {};
  const file = path.join(ROOT, ".env.push");
  const content = readIfExists(file);
  if (content !== null) {
    for (const l of parseEnv(content)) {
      if (l.isKey && l.value) creds[l.key] = l.value;
    }
  }
  for (const [key, value] of Object.entries(process.env)) {
    if (value) creds[key] = value;
  }
  return creds;
}

async function api(base, pathname, { token, method = "GET", body } = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    // Vercel nests errors as { error }, Render as { message }.
    const errMsg =
      json && typeof json.error === "object" && json.error
        ? json.error.message || json.error.code
        : json && (json.message || json.error);
    const detail = errMsg ? ` — ${errMsg}` : "";
    throw new Error(`${base}${pathname} → ${res.status}${detail}${text && !detail ? ` ${text.slice(0, 200)}` : ""}`);
  }
  return json;
}

function missingCred(name, hint) {
  console.log(red(`✗ ${name} is not set.`));
  console.log(`    ${hint}`);
  console.log(`    Put it in .env.push (see .env.push.example) or export it in your shell.`);
  process.exitCode = 1;
}

// Fetch ALL env vars for a Render service, following cursor pagination (20/page).
async function fetchAllRenderEnvVars(token, serviceId) {
  const remote = new Map();
  let cursor = "";
  // Safety cap: 25 pages × 20 vars = 500, far beyond any real service.
  for (let page = 0; page < 25; page += 1) {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const json = await api(RENDER_API, `/v1/services/${serviceId}/env-vars${qs}`, { token });
    const list = Array.isArray(json) ? json : Array.isArray(json.envVars) ? json.envVars : [];
    if (!list.length) break;
    for (const e of list) {
      const v = e && (e.envVar || e);
      if (v && v.key) remote.set(v.key, v.value);
    }
    cursor = list[list.length - 1].cursor;
    if (!cursor) break;
  }
  return remote;
}

async function pushRender(creds, vars, { dryRun, prune, deploy }) {
  const token = creds.RENDER_API_KEY;
  const ids = (creds.RENDER_SERVICE_IDS || creds.RENDER_SERVICE_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!token) {
    return missingCred("RENDER_API_KEY", "Create one at https://dashboard.render.com/account/api-keys");
  }
  if (!ids.length) {
    return missingCred(
      "RENDER_SERVICE_ID",
      "Service id looks like `srv-abc123` (from your Render service URL or GET /v1/services)."
    );
  }

  for (const id of ids) {
    console.log(`\n▶ Render service ${id}`);

    let remote = new Map();
    try {
      remote = await fetchAllRenderEnvVars(token, id);
    } catch (err) {
      console.log(red(`  ✗ could not read current env vars: ${err.message}`));
      process.exitCode = 1;
      return;
    }

    // Default: merge (local wins, remote-only vars kept). --prune: full sync.
    const finalVars = new Map(remote);
    for (const [k, v] of vars) finalVars.set(k, v);
    if (prune) {
      for (const k of remote.keys()) {
        if (!vars.has(k)) finalVars.delete(k);
      }
    }

    let added = 0;
    let updated = 0;
    let removed = 0;
    for (const [k, v] of finalVars) {
      if (!remote.has(k)) {
        console.log(`    + ${k} = ${maskSecret(v)}`);
        added += 1;
      } else if (remote.get(k) !== v) {
        console.log(`    ~ ${k} = ${maskSecret(v)} ${yellow(`(was ${maskSecret(remote.get(k))})`)}`);
        updated += 1;
      }
    }
    for (const k of remote.keys()) {
      if (!finalVars.has(k)) {
        console.log(`    - ${k} (removed${prune ? "" : " — use --prune to remove"})`);
        removed += 1;
      }
    }

    console.log(`  → ${added} added, ${updated} updated, ${removed} removed (${finalVars.size} total)`);

    if (dryRun) {
      console.log(yellow("  (dry run — nothing sent)"));
      continue;
    }

    const payload = [...finalVars.entries()].map(([key, value]) => ({ key, value }));
    try {
      await api(RENDER_API, `/v1/services/${id}/env-vars`, { token, method: "PUT", body: payload });
    } catch (err) {
      console.log(red(`  ✗ update failed: ${err.message}`));
      process.exitCode = 1;
      return;
    }

    // PUT replaces the whole list, so verify every var actually persisted.
    let after = new Map();
    try {
      after = await fetchAllRenderEnvVars(token, id);
    } catch {
      // Verification read failed — treat as dropped so we never claim success.
    }
    const dropped = [...finalVars.keys()].filter((k) => !after.has(k));
    if (dropped.length) {
      console.log(
        red(`  ✗ ${dropped.length} var(s) did NOT persist on Render (service may have a limit): ${dropped.join(", ")}`)
      );
      console.log("    Fix: reduce the list, or configure these in the Render dashboard / an environment group.");
      process.exitCode = 1;
      return;
    }
    console.log(green("  ✓ env vars updated on Render (all persisted)"));

    if (deploy) {
      try {
        await api(RENDER_API, `/v1/services/${id}/deploys`, { token, method: "POST", body: {} });
        console.log(green("  ✓ deploy triggered"));
      } catch (err) {
        console.log(red(`  ✗ deploy trigger failed: ${err.message}`));
        process.exitCode = 1;
      }
    } else {
      console.log(dim("  ℹ env changes do NOT auto-deploy on Render — use `npm run env:push:deploy` or push a commit."));
    }
  }
}

async function pushVercel(creds, vars, { dryRun, prune }) {
  const token = creds.VERCEL_TOKEN;
  const projectId = creds.VERCEL_PROJECT_ID;

  if (!token) {
    return missingCred("VERCEL_TOKEN", "Create one at https://vercel.com/account/tokens");
  }
  if (!projectId) {
    return missingCred(
      "VERCEL_PROJECT_ID",
      "Vercel project → Settings → General → Project ID (or run `vercel link` and copy it from .vercel/project.json)."
    );
  }

  // Team projects need ?teamId= on env API calls; derive it from the project record.
  let teamQuery = "";
  try {
    const project = await api(VERCEL_API, `/v6/projects/${projectId}`, { token });
    if (project && project.accountId && project.accountId.startsWith("team_")) {
      teamQuery = `?teamId=${project.accountId}`;
    }
  } catch {
    // Non-fatal: fall back to unqualified calls (personal projects).
  }

  console.log(`\n▶ Vercel project ${projectId}${teamQuery ? " (team)" : ""}`);

  let remote = new Map();
  try {
    const json = await api(VERCEL_API, `/v9/projects/${projectId}/env${teamQuery}`, { token });
    for (const e of json.envs || []) {
      if (e && e.key && Array.isArray(e.target) && e.target.includes("production")) {
        remote.set(e.key, e);
      }
    }
  } catch (err) {
    console.log(red(`  ✗ could not read current env vars: ${err.message}`));
    process.exitCode = 1;
    return;
  }

  const plans = [];
  for (const [key, value] of vars) {
    if (remote.has(key)) plans.push({ op: "update", key, value, id: remote.get(key).id });
    else plans.push({ op: "create", key, value });
  }
  if (prune) {
    for (const [key, record] of remote) {
      if (!vars.has(key)) plans.push({ op: "delete", key, id: record.id });
    }
  }

  let added = 0;
  let updated = 0;
  let removed = 0;
  for (const p of plans) {
    if (p.op === "create") {
      console.log(`    + ${p.key} = ${maskSecret(p.value)}`);
      added += 1;
    } else if (p.op === "update") {
      console.log(`    ~ ${p.key} = ${maskSecret(p.value)}`);
      updated += 1;
    } else {
      console.log(`    - ${p.key} (removed — no longer in ${path.relative(ROOT, TARGETS[1].envFile)})`);
      removed += 1;
    }
  }
  console.log(`  → ${added} added, ${updated} updated, ${removed} removed (${vars.size} total)`);

  if (dryRun) {
    console.log(yellow("  (dry run — nothing sent)"));
    return;
  }

  const deleteQs = `?target=production${teamQuery ? `&${teamQuery.slice(1)}` : ""}`;

  try {
    for (const p of plans) {
      if (p.op === "create") {
        await api(VERCEL_API, `/v10/projects/${projectId}/env${teamQuery}`, {
          token,
          method: "POST",
          body: { key: p.key, value: p.value, type: "encrypted", target: ["production"] },
        });
      } else if (p.op === "update") {
        await api(VERCEL_API, `/v6/projects/${projectId}/env/${p.id}${deleteQs}`, {
          token,
          method: "DELETE",
        });
        await api(VERCEL_API, `/v10/projects/${projectId}/env${teamQuery}`, {
          token,
          method: "POST",
          body: { key: p.key, value: p.value, type: "encrypted", target: ["production"] },
        });
      } else {
        await api(VERCEL_API, `/v6/projects/${projectId}/env/${p.id}${deleteQs}`, {
          token,
          method: "DELETE",
        });
      }
    }
    console.log(green("  ✓ env vars updated on Vercel (takes effect from the next build/deploy)"));
  } catch (err) {
    console.log(red(`  ✗ update failed: ${err.message}`));
    process.exitCode = 1;
  }
}

function printHelp() {
  console.log(`
env-push — push local env files to Render and Vercel

  npm run env:push             sync Render (server/.env.production) and Vercel (client/.env.production)
  npm run env:push:deploy      also trigger a Render deploy afterwards
  npm run env:push:dry         preview changes without sending anything
  npm run env:push -- --prune  also remove remote keys that left the local file
  npm run env:push -- --only=vercel   push a single provider

Credentials (in .env.push, gitignored — copy from .env.push.example):
  RENDER_API_KEY, RENDER_SERVICE_ID | RENDER_SERVICE_IDS
  VERCEL_TOKEN, VERCEL_PROJECT_ID
`);
}

async function main() {
  if (HELP) {
    printHelp();
    return;
  }

  const creds = loadCredentials();
  const vars = {};
  for (const t of TARGETS) {
    const m = getVars(t.envFile);
    if (m.size === 0) {
      console.log(yellow(`⚠ ${t.label}: no keys found in ${path.relative(ROOT, t.envFile)} — skipped`));
      continue;
    }
    vars[t.name] = m;
    console.log(
      `${t.label} ← ${path.relative(ROOT, t.envFile)} (${m.size} keys)${DRY_RUN ? " " + yellow("[dry run]") : ""}`
    );
  }
  console.log();

  for (const t of TARGETS) {
    if (only && !only.includes(t.name)) continue;
    if (!vars[t.name]) continue;
    try {
      if (t.name === "render") {
        await pushRender(creds, vars.render, { dryRun: DRY_RUN, prune: PRUNE, deploy: DEPLOY });
      } else {
        await pushVercel(creds, vars.vercel, { dryRun: DRY_RUN, prune: PRUNE });
      }
    } catch (err) {
      console.log(red(`✗ ${t.label}: ${err.message}`));
      process.exitCode = 1;
    }
  }

  if (!process.exitCode) {
    console.log("\nDone.");
  } else {
    console.log("\nFinished with errors — see above.");
  }
}

main();
