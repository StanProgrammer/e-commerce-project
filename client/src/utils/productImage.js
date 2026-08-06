// Appends Cloudinary delivery transforms (width, auto quality/format) to a
// Cloudinary URL. Non-Cloudinary URLs (blobs, local paths) are returned as-is.
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const marker = "/image/upload/";
  const index = url.indexOf(marker);

  if (index === -1) {
    return url;
  }

  const rest = url.slice(index + marker.length);

  // URLs that already carry a transform (e.g. new uploads with server-side
  // optimization baked in) are left untouched to avoid stacking transforms.
  const hasTransform = /^[a-z0-9_,]+,/.test(rest) || /^[a-z0-9_]+\/w_/.test(rest);
  if (hasTransform) {
    return url;
  }

  return `${url.slice(0, index + marker.length)}w_${width},q_auto,f_auto/${rest}`;
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
