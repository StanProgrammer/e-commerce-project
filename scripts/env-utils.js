"use strict";

const fs = require("fs");

// Read a file, returning null when it does not exist.
function readIfExists(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

// Detect the dominant line-ending style of a text file.
function detectEol(content) {
  return /\r\n/.test(String(content)) ? "\r\n" : "\n";
}

// Parse .env content into records; handles CRLF, export prefixes, and quoted values.
function parseEnv(content) {
  return String(content)
    .split("\n")
    .map((raw) => {
      const trimmed = raw.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return { raw, key: null, value: null, isKey: false };
      }

      let line = trimmed;
      if (/^export\s+/i.test(line)) {
        line = line.replace(/^export\s+/i, "");
      }

      const eq = line.indexOf("=");
      if (eq === -1) {
        return { raw, key: null, value: null, isKey: false };
      }

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return {
        raw,
        key,
        value,
        isKey: /^[A-Za-z_][A-Za-z0-9_]*$/.test(key),
      };
    });
}

// Ordered list of keys present in a file ([] if the file is missing).
function keysInOrder(file) {
  const content = readIfExists(file);
  if (content === null) return [];
  return parseEnv(content)
    .filter((l) => l.isKey)
    .map((l) => l.key);
}

// Map of key -> value for a file (empty Map if missing).
function getVars(file) {
  const content = readIfExists(file);
  const map = new Map();
  if (content === null) return map;
  for (const l of parseEnv(content)) {
    if (l.isKey) map.set(l.key, l.value);
  }
  return map;
}

// Mask a secret for display, e.g. `sk_•••r_123`.
function maskSecret(value) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}•••${value.slice(-4)} (${value.length} chars)`;
}

module.exports = { readIfExists, parseEnv, detectEol, keysInOrder, getVars, maskSecret };
