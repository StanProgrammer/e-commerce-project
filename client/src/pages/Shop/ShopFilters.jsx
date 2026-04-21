import React from "react";
const ShopFilters = ({ filteredProducts, setFilteredProducts, clearFilters, filters }) => {
  const categories = Array.isArray(filters?.categories) ? filters.categories : [];
  const colors = Array.isArray(filters?.colors) ? filters.colors : [];
  const priceRanges = Array.isArray(filters?.priceRange) ? filters.priceRange : [];

  const onCategoryChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, category: value }));

  const onColorChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, color: value }));

  const onPriceChange = (value) =>
    setFilteredProducts((prev) => ({ ...prev, priceRange: value }));

  return (
    <aside className="space-y-6 shrink-0 w-full md:w-64">
      <div className="flex items-center justify-between">
  <h3 className="text-xl font-medium">Filters</h3>

 <button
  type="button"
  onClick={clearFilters}
  className="clear-btn-icon"
>
  Clear
</button>

</div>


      {/* Category */}
      <div className="flex flex-col space-y-2 gap-1">
        <h4 className="font-medium text-lg">Category</h4>
        <hr />
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No categories</p>
        ) : (
          categories.map((category) => (
            <label key={category} className="mt-2 flex cursor-pointer gap-1!">
              <input
                type="radio"
                name="category"
                value={category}
                checked={(filteredProducts?.category ?? "all") === category}
                onChange={() => onCategoryChange(category)}
                className="align-middle"
              />
              <span className="ml-2 capitalize">{category}</span>
            </label>
          ))
        )}
      </div>

      {/* Color */}
      <div className="flex flex-col space-y-2">
        <h4 className="font-medium text-lg">Color</h4>
        <hr />
        {colors.length === 0 ? (
          <p className="text-sm text-gray-500">No colors</p>
        ) : (
          colors.map((color) => (
            <label key={color} className="mt-2 cursor-pointer flex items-center gap-1">
              <input
                type="radio"
                name="color"
                value={color}
                checked={(filteredProducts?.color ?? "all") === color}
                onChange={() => onColorChange(color)}
                className="align-middle"
              />
              <span className="ml-2 capitalize">{color}</span>
              {/* optional small color swatch */}
              <span
                aria-hidden
                className="ml-3 w-4 h-4 rounded-full border"
                style={{
                  background:
                    color === "all" ? "transparent" : color === "gold" ? "#D4AF37" : color,
                }}
              />
            </label>
          ))
        )}
      </div>

      {/* Price Range */}
      <div className="flex flex-col space-y-2">
        <h4 className="font-medium text-lg">Price Range</h4>
        <hr />
        {priceRanges.length === 0 ? (
          <p className="text-sm text-gray-500">No price ranges</p>
        ) : (
          priceRanges.map((range) => (
            <label key={range.label} className="flex gap-1 mt-2 cursor-pointer">
              <input
                type="radio"
                name="priceRange"
                value={range.label}
                checked={(filteredProducts?.priceRange ?? "") === range.label}
                onChange={() => onPriceChange(range.label)}
                className="align-middle"
              />
              <span className="ml-2">{range.label}</span>
            </label>
          ))
        )}
      </div>
      {/* {clear filter} */}

    </aside>
  );
};

export default ShopFilters;
