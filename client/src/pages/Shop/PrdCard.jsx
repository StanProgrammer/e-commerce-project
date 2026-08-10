import React from "react";
import { Link } from "react-router-dom";
import Ratings from "../../components/Ratings";
import { useDispatch } from "react-redux";
import { addToCart } from "../../store/features/cart/cartSlice";
import ImageWithSkeleton from "../../components/ImageWithSkeleton";
import toast from "react-hot-toast";
import { getProductPrimaryImage } from "../../utils/productImage";
import { getStockInfo } from "../../utils/stockStatus";

const STOCK_BADGE_CLASSES = {
  low: "bg-amber-500 text-white",
  out: "bg-gray-900/85 text-white",
};

const PrdCard = ({ products }) => {
  const dispatch = useDispatch();
  const handleAddToCart = (product) => {
    const stockInfo = getStockInfo(product.stock);

    if (stockInfo.status === "out") {
      toast.error("This product is currently out of stock.", {
        id: product._id, // prevents duplicate toasts
      });
      return;
    }

    // Dispatch add-to-cart
    dispatch(addToCart(product));
    toast.success(`${product.name} added to cart`, {
      id: product._id, // prevents duplicate
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
      {products.map((product) => {
        const stockInfo = getStockInfo(product.stock);
        const isOutOfStock = stockInfo.status === "out";

        return (
          <div key={product._id} className="product__card">
            <div className="relative">
              <Link to={`/shop/${product._id}`}>
                <ImageWithSkeleton
                  src={getProductPrimaryImage(product)}
                  alt={product.name || "product-image"}
                  className={`max-h-96 md:h-64 w-full object-cover transition-all duration-300 hover:scale-105 ${
                    isOutOfStock ? "opacity-60" : ""
                  }`}
                />
              </Link>

              {/* Stock badge */}
              {stockInfo.status === "low" || stockInfo.status === "out" ? (
                <span
                  className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${STOCK_BADGE_CLASSES[stockInfo.status]}`}
                >
                  {stockInfo.status === "out"
                    ? "Out of Stock"
                    : `Only ${stockInfo.stock} left`}
                </span>
              ) : null}

              <div className="hover:block absolute top-3 right-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  aria-disabled={isOutOfStock}
                  title={isOutOfStock ? "Out of stock" : "Add to cart"}
                  className={isOutOfStock ? "cursor-not-allowed" : ""}
                >
                  <i
                    className={`ri-shopping-cart-2-line p-1.5 ${
                      isOutOfStock
                        ? "bg-gray-300 text-gray-500"
                        : "bg-primary text-white hover:bg-primary-dark cursor-pointer"
                    }`}
                  ></i>
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
        );
      })}
    </div>
  );
};

export default PrdCard;
