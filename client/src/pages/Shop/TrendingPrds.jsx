import React, { useState } from 'react'
import PrdCard from './PrdCard'
import { useFetchAllProductsQuery } from '../../store/features/products/productsApi'
import MessageState from '../../components/MessageState'

const TrendingPrds = () => {
  const [visibleProducts, setVisibleProducts] = useState(8)

  const { data, isLoading, isError } = useFetchAllProductsQuery({
    limit: 20, // Fetch more products for trending
  });

  const products = data?.products ?? [];

  const handleLoadMore = () => {
    // Reset back to 8 when everything is already shown
    if (visibleProducts >= products.length) {
      setVisibleProducts(8)
    } else {
      setVisibleProducts(prev => prev + 4)
    }
  }

  const showAll = visibleProducts >= products.length

  if (isLoading) {
    return <MessageState tone="loading" title="Loading trending products" message="We are fetching the latest popular picks." />;
  }

  if (isError) {
    return <MessageState tone="error" title="Trending products could not be loaded" message="Refresh the page or visit the shop to browse all products." />;
  }

  return (
    <section className="section__container product__container">
      <h2 className="section__header">Trending Products</h2>

      <p className="section__subheader mb-12">
        Discover the Hottest Picks: Elevate Your Style with our Curated
        Selection of Trending Women's Fashion -- Dresses, Tops & Accessories
        for Every Occasion.
      </p>

      <div className="mt-4!">
        <PrdCard products={products.slice(0, visibleProducts)} />
      </div>

      <div className="product__btn mt-8 text-center">
        <button className="btn" onClick={handleLoadMore}>
          {showAll ? 'Show Less' : 'Load More'}
        </button>
      </div>
    </section>
  )
}

export default TrendingPrds
