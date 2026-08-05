import React, { useState } from "react";
import PrdCard from "../Shop/PrdCard";
import MessageState from "../../components/MessageState";
import { useFetchAllProductsQuery } from "../../store/features/products/productsApi";

const Search = () => {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const { data, isLoading, isFetching, isError } = useFetchAllProductsQuery({
    search: submittedSearch || undefined,
    limit: 100,
  });

  const products = data?.products ?? [];

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  };

  return (
    <>
      <section className="section__container bg-primary-light">
        <h2 className="section__header capitalize">Search Products</h2>
        <p className="section__subheader">Use the search bar below to find products by name.</p>
      </section>

      <section className="section__container">
        <div className="flex justify-center">
          <form onSubmit={handleSearch} className="flex items-center max-w-4xl w-full mb-4">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for products..."
              className="search-bar flex-1 h-12 rounded-l-md border border-gray-300"
            />

            <button type="submit" className="search-button h-12 px-5 rounded-r-md">
              Search
            </button>
          </form>
        </div>

        <div className="mt-8">
          {isLoading || isFetching ? (
            <MessageState
              tone="loading"
              title="Searching products"
              message="Finding products that match your search."
            />
          ) : isError ? (
            <MessageState
              tone="error"
              title="Search could not be completed"
              message="Refresh the page and try again."
            />
          ) : products.length === 0 ? (
            <MessageState
              tone="empty"
              title="No products match your search"
              message="Try a different keyword or browse the full shop."
            />
          ) : (
            <PrdCard products={products} />
          )}
        </div>
      </section>
    </>
  );
};

export default Search;
