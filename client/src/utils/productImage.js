export const getProductPrimaryImage = (product) => {
  if (!product) return "";

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  return product.image || "";
};

export const getProductImages = (product) => {
  if (!product) return [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }

  return product.image ? [product.image] : [];
};
