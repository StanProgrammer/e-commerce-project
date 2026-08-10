const Product = require("../models/prdModel");

// 3-letter color codes used in SKUs (e.g. WATCH-BLK-001).
const COLOR_CODES = {
  black: "BLK",
  silver: "SLV",
  gold: "GLD",
  red: "RED",
  blue: "BLU",
  green: "GRN",
  beige: "BGE",
};

// Escape a string for use inside a RegExp literal.
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// " Watch ", "WATCH", "watch  pro" -> "watch pro"
const normalizeName = (name) =>
  String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

// "Watch" -> "WATCH", "Linen Shirt" -> "LINEN-SHIRT", "" -> "PRD"
const nameCode = (name) => {
  const code = String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  return code || "PRD";
};

// "black" -> "BLK", "violet" -> "VIO", "" -> "GEN"
const colorCode = (color) => {
  const key = String(color || "").trim().toLowerCase();
  if (COLOR_CODES[key]) return COLOR_CODES[key];
  const letters = key.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase();
  return letters || "GEN";
};

// Bump the sequence until the SKU is unused; deleted SKUs are never reused.
const generateSku = async (name, color) => {
  const base = `${nameCode(name)}-${colorCode(color)}`;

  for (let sequence = 1; sequence <= 9999; sequence += 1) {
    const sku = `${base}-${String(sequence).padStart(3, "0")}`;
    const taken = await Product.exists({ sku });
    if (!taken) return sku;
  }

  throw new Error("Unable to generate a unique SKU.");
};

// Find another product with the same name + category + color (name is normalized).
const findVariantDuplicate = async ({ name, category, color, excludeId }) => {
  // Empty fields match "" or a missing field, so colorless twins still collide.
  const matchEmptyOrMissing = (value) =>
    value ? value : { $in: ["", null] };

  const query = {
    name: { $regex: `^${escapeRegex(normalizeName(name))}$`, $options: "i" },
    category: matchEmptyOrMissing(String(category || "").trim().toLowerCase()),
    color: matchEmptyOrMissing(String(color || "").trim().toLowerCase()),
    isDeleted: false,
  };

  if (excludeId) query._id = { $ne: excludeId };

  return Product.findOne(query);
};

module.exports = {
  COLOR_CODES,
  colorCode,
  escapeRegex,
  findVariantDuplicate,
  generateSku,
  nameCode,
  normalizeName,
};
