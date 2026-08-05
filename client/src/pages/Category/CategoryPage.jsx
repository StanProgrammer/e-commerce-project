import React from 'react';
import { useParams } from 'react-router-dom';
import categoryContent from '../../data/categoryContent';
import PrdCard from '../Shop/PrdCard';
import MessageState from '../../components/MessageState';
import { useFetchAllProductsQuery } from '../../store/features/products/productsApi';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const normalizedCategory = (categoryName || '').toLowerCase();

  const { data, isLoading, isError } = useFetchAllProductsQuery({
    category: normalizedCategory,
    limit: 100,
  });

  const products = data?.products ?? [];

  const current = categoryContent[normalizedCategory] || {
    title: categoryName,
    subtitle: 'Browse a wide range of products selected just for you.',
  };

  return (
    <>
      <section className="section__container bg-primary-light">
        <h2 className="section__header capitalize">{current.title}</h2>
        <p className="section__subheader">{current.subtitle}</p>
      </section>
      <section className="section__container">
        {isLoading ? (
          <MessageState
            tone="loading"
            title="Loading products"
            message="We are finding products in this category."
          />
        ) : isError ? (
          <MessageState
            tone="error"
            title="Products could not be loaded"
            message="Refresh the page and try again."
          />
        ) : products.length === 0 ? (
          <MessageState
            tone="empty"
            title="No products in this category yet"
            message="Check back soon or browse the full shop."
          />
        ) : (
          <PrdCard products={products} />
        )}
      </section>
    </>
  );
};

export default CategoryPage;
