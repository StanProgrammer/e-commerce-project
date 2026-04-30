import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PrdCard from "./PrdCard";
import ShopFilters from "./ShopFilters";
import Pagination from "../../components/Pagination";
import { useFetchAllProductsQuery } from "../../store/features/products/productsApi";
import MessageState from "../../components/MessageState";

const filters = {
  categories: ["all", "accessories", "clothes", "jewellery", "cosmetics"],
  colors: ["all", "red", "blue", "green", "black", "gold", "silver", "beige"],
  priceRange: [
    { label: "Under $50", min: 0, max: 50 },
    { label: "$50 to $100", min: 50, max: 100 },
    { label: "$100 to $200", min: 100, max: 200 },
    { label: "Over $200", min: 200, max: Infinity },
  ],
};

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersState, setFiltersState] = useState({
    category: searchParams.get("category") || "all",
    color: searchParams.get("color") || "all",
    priceRange: searchParams.get("priceRange") || "",
  });

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const PRODUCTS_PER_PAGE = 8;

  const { category, color, priceRange } = filtersState;

  useEffect(() => {
    setFiltersState({
      category: searchParams.get("category") || "all",
      color: searchParams.get("color") || "all",
      priceRange: searchParams.get("priceRange") || "",
    });
    setCurrentPage(Number(searchParams.get("page")) || 1);
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (category !== "all") nextParams.set("category", category);
    if (color !== "all") nextParams.set("color", color);
    if (priceRange) nextParams.set("priceRange", priceRange);
    if (currentPage > 1) nextParams.set("page", String(currentPage));

    const currentParamsString = searchParams.toString();
    const nextParamsString = nextParams.toString();

    if (currentParamsString !== nextParamsString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [category, color, priceRange, currentPage, searchParams, setSearchParams]);

  /* ---------------- PRICE PARSING ---------------- */
  const [minPrice, maxPrice] = useMemo(() => {
    if (!priceRange) return [undefined, undefined];
    const [min, max] = priceRange.split("-").map(Number);
    return [Number.isNaN(min) ? undefined : min, Number.isNaN(max) ? undefined : max];
  }, [priceRange]);

  /* ---------------- API CALL ---------------- */
  const { data, isLoading, isFetching, error } = useFetchAllProductsQuery({
    category: category !== "all" ? category : undefined,
    color: color !== "all" ? color : undefined,
    minPrice,
    maxPrice,
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
  });

  const products = data?.products ?? [];
  const totalPages = data?.totalPages ?? 1;

  /* ---------------- HELPERS ---------------- */
  const clearFilters = () => {
    setFiltersState({
      category: "all",
      color: "all",
      priceRange: "",
    });
    setCurrentPage(1);
  };

  return (
    <>
      {/* HEADER */}
      <section className="section__container bg-primary-light">
        <h2 className="section__header capitalize">Shop Page</h2>
        <p className="section__subheader">
          Discover our curated collection of trend-setting fashion, timeless essentials, and everyday favorites. Shop
          premium styles crafted to elevate your wardrobe with quality, comfort, and elegance.
        </p>
      </section>

      {/* CONTENT */}
      <section className="section__container">
        <div className="flex flex-col md:flex-row md:gap-12 gap-8">
          {/* FILTERS */}
          <ShopFilters
            filteredProducts={filtersState}
            setFilteredProducts={(updater) => {
              setFiltersState((prev) => {
                const nextState =
                  typeof updater === "function" ? updater(prev) : updater;

                return nextState;
              });
              setCurrentPage(1);
            }}
            clearFilters={clearFilters}
            filters={filters}
          />

          {/* PRODUCTS */}
          <div className="flex-1">
            <h3 className="text-2xl font-medium mb-4">Products Available: {data?.totalProducts ?? 0}</h3>

            {isLoading || isFetching ? (
              <MessageState tone="loading" title="Loading products" message="We are finding products that match your filters." />
            ) : error ? (
              <MessageState
                tone="error"
                title="Products could not be loaded"
                message="Refresh the page, or clear your filters and try again."
              />
            ) : products.length === 0 ? (
              <MessageState
                tone="empty"
                title="No products match your filters"
                message="Clear one or more filters to see more products."
                action={
                  <button type="button" onClick={clearFilters} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
                    Clear filters
                  </button>
                }
              />
            ) : (
              <PrdCard products={products} />
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default ShopPage;
