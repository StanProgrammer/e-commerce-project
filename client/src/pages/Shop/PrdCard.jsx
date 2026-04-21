import React from "react";
import { Link } from "react-router-dom";
import Ratings from "../../components/Ratings";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/features/cart/cartSlice";
import ImageWithSkeleton from "../../components/ImageWithSkeleton";
import toast from "react-hot-toast";

const PrdCard = ({ products }) => {
  const dispatch = useDispatch();
  const handleAddToCart = (product) => {
    //dispatch action to add product to cart
    dispatch(addToCart(product));
    toast.success(`${product.name} added to cart`, {
  id: product._id, // prevents duplicate 
});

  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
    {products.map((product) => (
  <div key={product._id} className="product__card">
    <div className="relative">
      <Link to={`/shop/${product._id}`}>
        <ImageWithSkeleton
          src={product.image}
          alt={product.name || "product-image"}
          className="max-h-96 md:h-64 w-full object-cover transition-all duration-300 hover:scale-105"
        />
      </Link>

      <div className="hover:block absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(product);
          }}
        >
          <i className="ri-shopping-cart-2-line bg-primary p-1.5 text-white hover:bg-primary-dark cursor-pointer"></i>
        </button>
      </div>
    </div>

    <div className="product__card__content">
      <h4>{product.name}</h4>
      <p>
        ${product.price}
        {product.oldPrice && (
          <span className="text-gray-500 ml-2">
            <s>${product.oldPrice}</s>
          </span>
        )}
      </p>
      <Ratings rating={product.rating} />
    </div>
  </div>
))}

    </div>
  );
};

export default PrdCard;
