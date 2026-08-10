import { describe, it, expect } from "vitest";
import {
  getOptimizedImageUrl,
  getProductPrimaryImage,
  getProductImages,
} from "./productImage";

describe("productImage helpers", () => {
  it("returns an empty string for a missing product", () => {
    expect(getProductPrimaryImage(null)).toBe("");
    expect(getProductPrimaryImage(undefined)).toBe("");
  });

  it("uses the first image from the images array", () => {
    const product = { images: ["a.jpg", "b.jpg"] };
    expect(getProductPrimaryImage(product)).toBe("a.jpg");
  });

  it("falls back to the legacy image field", () => {
    expect(getProductPrimaryImage({ image: "legacy.jpg" })).toBe("legacy.jpg");
  });

  it("inserts Cloudinary delivery transforms for sized URLs", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v12345/shirt.jpg";
    const optimized = getOptimizedImageUrl(url, 600);

    expect(optimized).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_600,q_auto,f_auto/v12345/shirt.jpg"
    );
  });

  it("leaves URLs that already have transforms untouched", () => {
    const url =
      "https://res.cloudinary.com/demo/image/upload/w_1400,c_limit,q_auto/v12345/shirt.jpg";
    expect(getOptimizedImageUrl(url, 600)).toBe(url);
  });

  it("downsizes Unsplash URLs via query params", () => {
    const url =
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop";
    const optimized = getOptimizedImageUrl(url, 600);

    expect(optimized).toContain("w=600");
    expect(optimized).toContain("q=60");
    expect(optimized).toContain("auto=format");
    expect(optimized).toContain("fit=crop");
    expect(optimized).not.toContain("w=2070");
  });

  it("handles plus.unsplash.com URLs too", () => {
    const url = "https://plus.unsplash.com/premium_photo-1234";
    const optimized = getOptimizedImageUrl(url, 1200);

    expect(optimized).toContain("w=1200");
    expect(optimized).toContain("q=60");
  });

  it("leaves non-Cloudinary non-Unsplash URLs untouched", () => {
    expect(getOptimizedImageUrl("blob:abc123", 600)).toBe("blob:abc123");
    expect(getOptimizedImageUrl("", 600)).toBe("");
  });

  it("returns all product images", () => {
    const product = { images: ["a.jpg", "b.jpg"] };
    expect(getProductImages(product)).toEqual(["a.jpg", "b.jpg"]);
  });
});
