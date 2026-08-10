import { describe, it, expect } from "vitest";
import { buildProductsQuery } from "./productsApi";

const buildUrl = (args) => buildProductsQuery(args);

describe("fetchAllProducts query builder", () => {
  it("omits empty-string price filters (they 400 on the server)", () => {
    const url = buildUrl({ minPrice: "", maxPrice: "", page: 1, limit: 10 });

    expect(url).not.toContain("minPrice");
    expect(url).not.toContain("maxPrice");
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });

  it("keeps 0 as a valid price floor", () => {
    const url = buildUrl({ minPrice: 0, maxPrice: 50, page: 1, limit: 10 });

    expect(url).toContain("minPrice=0");
    expect(url).toContain("maxPrice=50");
  });

  it("omits undefined and null price filters", () => {
    const url = buildUrl({ minPrice: undefined, maxPrice: null, page: 1, limit: 10 });

    expect(url).not.toContain("minPrice");
    expect(url).not.toContain("maxPrice");
  });

  it("omits empty category and color", () => {
    const url = buildUrl({ category: "", color: "", page: 1, limit: 10 });

    expect(url).not.toContain("category");
    expect(url).not.toContain("color");
  });

  it("defaults page and limit when omitted", () => {
    const url = buildUrl({});

    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });
});
