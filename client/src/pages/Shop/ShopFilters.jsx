import React from "react";

const colorMap = {
  red: "#ef4444",
  blue: "#1d4ed8",
  green: "#2f8f2f",
  black: "#020617",
  gold: "#d4af37",
  silver: "#cbd5e1",
  beige: "#d9c6a5",
};

const formatLabel = (value) =>
  value === "all"
    ? "All"
    : String(value)
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const getPriceValue = (range) => range.value || `${range.min ?? ""}-${range.max ?? ""}`;

const ShopFilters = ({ filteredProducts, setFilteredProducts, clearFilters, filters }) => {
  const categories = Array.isArray(filters?.categories) ? filters.categories : [];
  const colors = Array.isArray(filters?.colors) ? filters.colors : [];
  const priceRanges = Array.isArray(filters?.priceRange) ? filters.priceRange : [];

  const selectedCategory = filteredProducts?.category ?? "all";
  const selectedColor = filteredProducts?.color ?? "all";
  const selectedPriceRange = filteredProducts?.priceRange ?? "";
  const activeCount = [
    selectedCategory !== "all",
    selectedColor !== "all",
    Boolean(selectedPriceRange),
  ].filter(Boolean).length;

  const onCategoryChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, category: value }));

  const onColorChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, color: value }));

  const onPriceChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, priceRange: value }));

  return (
    <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Shop by</p>
              <h3 className="mt-1 flex items-center gap-2 text-xl font-semibold text-slate-950">
                <i className="ri-equalizer-2-line text-primary" aria-hidden="true" />
                Filters
              </h3>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              disabled={activeCount === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
            >
              <i className="ri-refresh-line text-base" aria-hidden="true" />
              Clear
            </button>
          </div>

          {activeCount > 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {activeCount} active {activeCount === 1 ? "filter" : "filters"}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Refine products by category, color, and price.</p>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          <section className="px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Category</h4>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {formatLabel(selectedCategory)}
              </span>
            </div>

            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">No categories</p>
            ) : (
              <div className="grid gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category;

                  return (
                    <label
                      key={category}
                      className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-primary bg-primary-light text-primary"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={isSelected}
                          onChange={() => onCategoryChange(category)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="capitalize">{formatLabel(category)}</span>
                      </span>
                      {isSelected && <i className="ri-check-line text-lg" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Color</h4>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {formatLabel(selectedColor)}
              </span>
            </div>

            {colors.length === 0 ? (
              <p className="text-sm text-slate-500">No colors</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {colors.map((color) => {
                  const isSelected = selectedColor === color;
                  const swatchColor = colorMap[color] || color;

                  return (
                    <label
                      key={color}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-primary bg-primary-light text-primary"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        checked={isSelected}
                        onChange={() => onColorChange(color)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          color === "all" ? "border-slate-300 bg-white" : "border-black/10"
                        }`}
                        style={{
                          background: color === "all" ? "#ffffff" : swatchColor,
                        }}
                      >
                        {isSelected && (
                          <i
                            className={`ri-check-line text-xs ${
                              ["all", "silver", "beige", "gold"].includes(color) ? "text-slate-900" : "text-white"
                            }`}
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span className="capitalize">{formatLabel(color)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          <section className="px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Price</h4>
              {selectedPriceRange && (
                <button
                  type="button"
                  onClick={() => onPriceChange("")}
                  className="text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  Reset
                </button>
              )}
            </div>

            {priceRanges.length === 0 ? (
              <p className="text-sm text-slate-500">No price ranges</p>
            ) : (
              <div className="grid gap-2">
                {priceRanges.map((range) => {
                  const value = getPriceValue(range);
                  const isSelected = selectedPriceRange === value || selectedPriceRange === range.label;

                  return (
                    <label
                      key={range.label}
                      className={`flex min-h-11 cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        isSelected
                          ? "border-primary bg-primary-light text-primary"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="priceRange"
                          value={value}
                          checked={isSelected}
                          onChange={() => onPriceChange(value)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>{range.label}</span>
                      </span>
                      {isSelected && <i className="ri-check-line text-lg" aria-hidden="true" />}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </aside>
  );
};

export default ShopFilters;
