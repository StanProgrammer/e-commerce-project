// Adds Cloudinary or Unsplash resize/format transforms to a URL.
// Unknown hosts pass through unchanged.
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== "string") {
    return url;
  }

  if (url.includes("res.cloudinary.com")) {
    const marker = "/image/upload/";
    const index = url.indexOf(marker);

    if (index === -1) {
      return url;
    }

    const rest = url.slice(index + marker.length);

    // Skip URLs that already carry a transform so we never stack them.
    const hasTransform = /^[a-z0-9_,]+,/.test(rest) || /^[a-z0-9_]+\/w_/.test(rest);
    if (hasTransform) {
      return url;
    }

    return `${url.slice(0, index + marker.length)}w_${width},q_auto,f_auto/${rest}`;
  }

  // Unsplash serves sized/optimized images via query params — replace the
  // width and quality instead of appending duplicates.
  if (/(images|plus)\.unsplash\.com/.test(url)) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "60");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
};

export const getProductPrimaryImage = (product, width) => {
  let url = "";

  if (!product) {
    return "";
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    url = product.images[0];
  } else {
    url = product.image || "";
  }

  return getOptimizedImageUrl(url, width);
};

export const getProductImages = (product, width) => {
  if (!product) return [];

  const urls = Array.isArray(product.images) && product.images.length > 0
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];

  return width ? urls.map((url) => getOptimizedImageUrl(url, width)) : urls;
};
