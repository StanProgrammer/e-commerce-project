import React,{useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearCart } from "../../store/features/cart/cartSlice";
import getBaseUrl from "../../utils/baseUrl";
const OrderSummary = () => {
  const [redirecting, setRedirecting] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const products = useSelector((state) => state.cart.products);
  const clearTheCart = () => {
    // dispatch action to clear the cart
    dispatch(clearCart());
  };

  //payment integration
const handleCheckout = async () => {
  setRedirecting(true);
  
  const response = await fetch(
    `${getBaseUrl()}/api/orders/checkout-session`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products,
        userId: user?._id,
        email: user?.email,
      }),
    }
  );

  const session = await response.json();
  if (!session?.url) {
  throw new Error("Stripe URL missing");
}

window.location.href = session.url;
};


  const { tax, taxRate, grandTotal, totalPrice, selectedItems } = useSelector((state) => state.cart);
  if (redirecting) {
  return <div>Redirecting to payment...</div>;
}

  return (
    <div className="bg-primary-light mt-5 rounded text-base">
      <div className="px-6 py-4 space-y-5">
        <h2 className="font-semibold text-lg p-4 border-b border-border">Order Summary</h2>
        <p className="text-text-dark mt-2">Selected Items: {selectedItems}</p>
        <p>Total Price: ${totalPrice.toFixed(2)}</p>
        <p>
          Tax ({taxRate * 100}%) : ${tax.toFixed(2)}
        </p>
        <h3>GrandTotal: ${grandTotal.toFixed(2)}</h3>
        <div className="px-4 mb-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearTheCart();
            }}
            className="bg-red-500 px-3 py-1.5 text-white mt-2 rounded-md flex justify-between items-center mb-4 cursor-pointer"
          >
            <span className="mr-2">Clear Cart</span>
            <i className="ri-delete-bin-6-line"></i>
          </button>
          <button 
          onClick={handleCheckout}
          className="bg-green-600 px-3 py-1.5 text-white mt-2 rounded-md flex justify-between items-center mb-4">
            <span className="mr-2">Proceed To Checkout</span>
            <i className="ri-shopping-cart-2-line"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
