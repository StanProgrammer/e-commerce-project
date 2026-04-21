import React, { useMemo, useState } from "react";
import PrdCard from "./PrdCard";
import ShopFilters from "./ShopFilters";
import Pagination from "../../components/Pagination";
import { useFetchAllProductsQuery } from "../../store/features/products/productsApi";

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
  const [filtersState, setFiltersState] = useState({
    category: "all",
    color: "all",
    priceRange: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 8;

  const { category, color, priceRange } = filtersState;

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
            setFilteredProducts={setFiltersState}
            clearFilters={clearFilters}
            filters={filters}
          />

          {/* PRODUCTS */}
          <div className="flex-1">
            <h3 className="text-2xl font-medium mb-4">Products Available: {data?.totalProducts ?? 0}</h3>

            {isLoading || isFetching ? (
              <p>Loading products...</p>
            ) : error ? (
              <p className="text-red-500">Failed to load products.</p>
            ) : products.length === 0 ? (
              <p>No products found.</p>
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
