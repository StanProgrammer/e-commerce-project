import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import products from '../../data/products';
import categoryContent from '../../data/categoryContent';
import PrdCard from '../Shop/PrdCard';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const [filteredProducts, setFilteredProducts] = useState([]);

  
  useEffect(() => {
    const filtered = products.filter(

      (product) => {
        return product.category.toLowerCase() === categoryName.toLowerCase()
      }
    );
    setFilteredProducts(filtered);
  }, [categoryName]);

  const current = categoryContent[categoryName.toLowerCase()] || {
    title: categoryName,
    subtitle:
      "Browse a wide range of products selected just for you."
  };

  return (
    <>
      <section className="section__container bg-primary-light">
        <h2 className="section__header capitalize">{current.title}</h2>
        <p className="section__subheader">{current.subtitle}</p>
      </section>
      <div className="section__container">
        <PrdCard products={filteredProducts} />
      </div>
    </>
  );
};

export default CategoryPage;
