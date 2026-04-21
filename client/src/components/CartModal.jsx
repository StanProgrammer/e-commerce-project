import React from "react";
import OrderSummary from "../pages/Shop/OrderSummary";
import { useDispatch } from "react-redux";
import { removeFromCart, updateQuantity } from "../store/features/cart/cartSlice";

const CartModal = ({ products, isOpen, onClose }) => {
  const dispatch = useDispatch();
 const handleQuantityChange = (type, _id) => {
  dispatch(updateQuantity({ type, _id }));
};
  const removeCart = (e, _id) => {
  e.preventDefault();
  dispatch(removeFromCart({ _id }));
};
  return (
    <div
      className={`
        fixed inset-0 z-1000
        
        bg-black/45
        transition-opacity duration-300
       
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      onClick={onClose}
    >
      <div
        className={`fixed top-0 right-0 md:w-1/3 w-full h-full bg-white overflow-y-auto shadow-lg transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ transition: "transform 0.3s ease-in-out cubic-bezeir(0.25,0.45,0.45,0.94)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4!">
          <div className="flex justify-between items-center mb-4!">
            <h4 className="text-xl font-semibold">Your Cart</h4>
            <button className="text-gray-600  hover:text-gray-900 cursor-pointer" onClick={onClose}>
              <i className="ri-xrp-line bg-black p-1 text-white"></i>
            </button>
          </div>

          <div className="cart-items">
            {products.length === 0 ? (
              <div>Your cart is empty.</div>
            ) : (
              products.map((product, index) => (
                <div
                  key={product._id}
                  className="flex flex-col md:flex-row md-items-center md:justify-between shadow-md md:p-5 p-2 mb-4"
                >
                  <div className="flex items-center">
                    <span
                      className="
                          mr-4 
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
                    <img src={product.image} alt={product.name} className="size-12 object-cover mr-4 " />
                    <div>
                      <h5 className="font-semibold">{product.name}</h5>
                      <p className="text-sm text-gray-800 font-semibold">${Number(product.price)}</p>
                    </div>
                    <div className="flex flex-row md:justify-start justify-end items-center mt-2">
                      <button
                        onClick={() => handleQuantityChange("decrement", product._id)}
                        className="size-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-primary hover:text-white ml-8 cursor-pointer"
                      >
                        -
                      </button>

                      <span className="px-2 text-center mx-1">{product.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange("increment", product._id)}
                        className="size-6 flex items-center px-1.5 rounded-full bg-gray-200 text-gray-700 hover:bg-primary
                      hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                      <div className="ml-5">
                        <button onClick={(e)=> removeCart(e,product._id)} className="text-red-500 hover:text-red-500 mr-4 cursor-pointer">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* calculate total price */}
          {products.length > 0 && <OrderSummary />}
        </div>
      </div>
    </div>
  );
};

export default CartModal;
