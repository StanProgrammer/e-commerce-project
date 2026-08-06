// Shared stock-status helper used by the storefront and admin panels.
// Keep in sync with the server's LOW_STOCK_THRESHOLD default (config/env.js).
export const LOW_STOCK_THRESHOLD = 5;

export const STOCK_STATUS_META = {
  in: { label: "In Stock", emoji: "🟢" },
  low: { label: "Low Stock", emoji: "🟡" },
  out: { label: "Out of Stock", emoji: "🔴" },
  unlimited: { label: "Unlimited", emoji: "∞" },
};

/**
 * Classify a product's stock level.
 * Returns `{ tracksStock, status, label, stock }` where `status` is one of
 * "in" | "low" | "out" | "unlimited".
 */
export const getStockInfo = (stock, lowThreshold = LOW_STOCK_THRESHOLD) => {
  const tracksStock =
    stock !== undefined && stock !== null && stock !== "";

  if (!tracksStock) {
    return {
      tracksStock: false,
      status: "unlimited",
      label: STOCK_STATUS_META.unlimited.label,
      stock: null,
    };
  }

  const value = Number(stock);

  if (!Number.isFinite(value) || value <= 0) {
    return {
      tracksStock: true,
      status: "out",
      label: STOCK_STATUS_META.out.label,
      stock: value,
    };
  }

  if (value <= lowThreshold) {
    return {
      tracksStock: true,
      status: "low",
      label: STOCK_STATUS_META.low.label,
      stock: value,
    };
  }

  return {
    tracksStock: true,
    status: "in",
    label: STOCK_STATUS_META.in.label,
    stock: value,
  };
};
