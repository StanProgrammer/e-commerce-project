import React, { useState } from "react";
import products from "../../data/products";
import PrdCard from "../Shop/PrdCard";

const Search = () => {
  const [search, setSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    const value = search.toLowerCase().trim();
    if (!value) {
      setFilteredProducts(products)
      return;
    }
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(value)
    );
    setFilteredProducts(filtered);
  };

  return (
    <>
      <section className="section__container bg-primary-light">
        <h2 className="section__header capitalize">Search Products</h2>
        <p className="section__subheader">Use the search bar below to find products by name.</p>
      </section>

      <section className="section__container">
        <div className="flex justify-center">
          <form onSubmit={handleSearch} className="flex items-center max-w-4xl w-full mb-4!">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products..."
              className="search-bar flex-1 h-12 rounded-l-md border border-gray-300"
            />

            <button type="submit" className="search-button h-12 px-5 rounded-r-md">
              Search
            </button>
          </form>
        </div>

        <div className="mt-8">
          <PrdCard products={filteredProducts} />
        </div>
      </section>
    </>
  );
};

export default Search;
