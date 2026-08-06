import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { clearCart } from "../store/features/cart/cartSlice";
import { useConfirmPaymentMutation } from "../store/features/orders/orderApi";
import TimeStep from "./TimeStep";
import MessageState from "./MessageState";

const PaymentSuccess = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const dispatch = useDispatch();
  const [confirmPayment] = useConfirmPaymentMutation();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get("session_id");

    if (!sessionId) {
      setStatusMessage("Payment session is missing. Return to your orders page to confirm your order status.");
      return;
    }

    let cancelled = false;

    confirmPayment({ sessionId })
      .unwrap()
      .then((data) => {
        if (cancelled) return;

        if (!data?.order) {
          throw new Error("Order details were not returned.");
        }

        setOrderDetails(data.order);
        dispatch(clearCart());
      })
      .catch((error) => {
        if (cancelled) return;

        const timedOut =
          error?.status === "TIMEOUT_ERROR" ||
          error?.status === "FETCH_ERROR";

        const message = timedOut
          ? "The payment provider took too long to respond. Your payment may still be processing. Check your orders page in a moment."
          : error?.data?.message ||
            error?.message ||
            "Payment was received, but we could not load the order details. Check your orders page for the latest status.";

        setStatusMessage(message);
      });

    return () => {
      cancelled = true;
    };
  }, [confirmPayment, dispatch]);

  if (statusMessage) {
    return (
      <MessageState
        tone="error"
        title="Order confirmation needs attention"
        message={statusMessage}
        className="section__container"
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/dashboard/orders" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              View orders
            </Link>
            <Link to="/shop" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary">
              Continue shopping
            </Link>
          </div>
        }
      />
    );
  }

  if (!orderDetails) {
    return <MessageState tone="loading" title="Confirming your payment" message="Please wait while we verify your payment and prepare your order details." className="section__container" />;
  }

  const isCompleted = (status) => {
    // A canceled order has no completed steps.
    if (orderDetails.status === "canceled") return false;

    const statusMap = ["pending", "processing", "shipped", "delivered"];
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
      status: "delivered",
      label: "Delivered",
      description: "Your order has been delivered successfully.",
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
