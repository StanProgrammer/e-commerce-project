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

  it("leaves non-Cloudinary URLs untouched", () => {
    expect(getOptimizedImageUrl("blob:abc123", 600)).toBe("blob:abc123");
    expect(getOptimizedImageUrl("", 600)).toBe("");
  });

  it("returns all product images", () => {
    const product = { images: ["a.jpg", "b.jpg"] };
    expect(getProductImages(product)).toEqual(["a.jpg", "b.jpg"]);
  });
});
