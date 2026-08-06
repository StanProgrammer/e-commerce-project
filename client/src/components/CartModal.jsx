import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import OrderSummary from "../pages/Shop/OrderSummary";
import { useDispatch } from "react-redux";
import { removeFromCart, updateQuantity } from "../store/features/cart/cartSlice";
import { getProductPrimaryImage } from "../utils/productImage";

const CartModal = ({ products, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const handleQuantityChange = (type, _id) => {
    dispatch(updateQuantity({ type, _id }));
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const removeCart = (e, _id) => {
    e.preventDefault();
    dispatch(removeFromCart({ _id }));
  };

  return createPortal(
    (
    <div
      className={`
        fixed inset-0 z-[1000]
        bg-black/45
        transition-opacity duration-300
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white overflow-y-auto shadow-2xl transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ transition: "transform 0.3s ease-in-out cubic-bezier(0.25, 0.45, 0.45, 0.94)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
            <h4 className="text-xl font-semibold">Your Cart</h4>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-gray-600 transition hover:border-slate-300 hover:text-gray-900 cursor-pointer"
              onClick={onClose}
              aria-label="Close cart"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <div className="cart-items">
            {products.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-slate-600">Your cart is empty.</div>
            ) : (
              products.map((product, index) => {
                const isOutOfStock =
                  product.stock !== undefined &&
                  product.stock !== null &&
                  Number(product.stock) <= 0;

                return (
                <div
                  key={product._id}
                  className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 p-3 shadow-sm md:p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="
                          size-6                 
                          bg-primary 
                          text-white
                          rounded-full 
                          flex items-center justify-center
                          text-xs font-semibold
                        "
                    >
                      0{index + 1}
                    </span>
                    <img
                      src={getProductPrimaryImage(product)}
                      alt={product.name}
                      className="size-12 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold">{product.name}</h5>
                      <p className="text-sm text-gray-800 font-semibold">${Number(product.price)}</p>
                      {isOutOfStock && (
                        <p className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <i className="ri-close-circle-line" aria-hidden="true"></i>
                          Out of stock
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleQuantityChange("decrement", product._id)}
                        className="flex size-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-primary hover:text-white cursor-pointer"
                      >
                        -
                      </button>

                      <span className="mx-2 min-w-6 text-center">{product.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange("increment", product._id)}
                        disabled={isOutOfStock}
                        className="flex size-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-primary hover:text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={(e) => removeCart(e, product._id)}
                      className="text-sm font-medium text-red-500 hover:text-red-600 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>
          {/* calculate total price */}
      {products.length > 0 && <OrderSummary />}
        </div>
      </div>
    </div>
    ),
    document.body
  );
};

export default CartModal;
