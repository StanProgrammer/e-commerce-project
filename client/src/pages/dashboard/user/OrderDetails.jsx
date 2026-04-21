import React from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useGetOrderByIdQuery } from '../../../store/features/orders/orderApi';
import TimeStep from '../../../components/TimeStep';

const OrderDetails = () => {
    const { user } = useSelector((state) => state.auth);
    const { orderId } = useParams();
    const { data: orderDetails, isLoading, isError } = useGetOrderByIdQuery(orderId);
    if(isLoading) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500">
                Loading order details...
            </div>
        );
    }
    if(isError) {
        return (
            <div className="flex items-center justify-center h-40 text-red-500">404 - Order not found</div>
        );
    }
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
  )
}

export default OrderDetails