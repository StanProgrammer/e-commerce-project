import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearCart } from "../store/features/cart/cartSlice";
import getBaseUrl from "../utils/baseUrl";
import TimeStep from "./TimeStep";

const PaymentSuccess = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get("session_id");
    if (sessionId) {
      fetch(`${getBaseUrl()}/api/orders/confirm-payment`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId })

      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Order details:", data);
          setOrderDetails(data.order);
          if (data?.order) {
            dispatch(clearCart());
          }
        })
        .catch((error) => {
          console.log("Error fetching order details:", error);
        });
    }
  }, [dispatch]);
  if (!orderDetails) {
    return <div>Loading...</div>;
  }
  const isCompleted = (status) => {
    const statusMap = ["pending", "processing", "shipped", "completed"];
    return statusMap.indexOf(status) < statusMap.indexOf(orderDetails.status);
  };
const isCurrent = (status) => orderDetails.status === status;
  const steps = [
    {
      status: "pending",
      label: "Pending",
      description: "Your order has been created and is awaiting processing.",
      icon: { iconName: "time-line", bgColor: "red-500", textColor: "gray-800" },
    },
    {
      status: "processing",
      label: "Processing",
      description: "Your order is currently being processed.",
      icon: { iconName: "loader-line", bgColor: "yellow-800", textColor: "yellow-800" },
    },
    {
      status: "shipped",
      label: "Shipped",
      description: "Your order has been shipped.",
      icon: { iconName: "truck-line", bgColor: "blue-800", textColor: "blue-800" },
    },
    {
      status: "completed",
      label: "Completed",
      description: "Your order has been successfully completed.",
      icon: { iconName: "check-line", bgColor: "green-800", textColor: "green-900" },
    },
  ];
  
  return (
    <section className="section__container rounded-lg bg-white p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-green-800">Payment {orderDetails?.status}</h2>
      <p className="text-gray-700 mb-6">Order ID: {orderDetails?.orderId}</p>
      <p className="text-gray-600 mb-4">Status: {orderDetails?.status}</p>
     <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-between relative">
  {steps.map((step, index) => (
    <TimeStep
      key={index}
      step={step}
      orderDetails={orderDetails}
      isCompleted={isCompleted(step.status)}
      isCurrent={isCurrent(step.status)}
      isLastStep={index === steps.length - 1}
    />
  ))}
</ol>

    </section>
  );
};

export default PaymentSuccess;
