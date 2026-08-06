import React from "react";
import { useSelector } from "react-redux";
import { useGetMyOrdersQuery } from "../../../store/features/orders/orderApi";
import { Link } from "react-router-dom";
import MessageState from "../../../components/MessageState";

const statusStyles = {
  delivered: "bg-green-100 text-green-700",
  shipped: "bg-indigo-100 text-indigo-700",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  canceled: "bg-red-100 text-red-700",
};

const UserOrders = () => {
  const { user } = useSelector((state) => state.auth);

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useGetMyOrdersQuery(undefined, {
    skip: !user,
  });

  if (!user) {
    return (
      <MessageState
        title="Sign in to view orders"
        message="Your order history is linked to your account. Sign in, then return to this page."
      />
    );
  }

  return (
    <section className="px-6 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Your Orders
        </h2>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          ) : isError ? (
            <MessageState
              tone="error"
              title="Orders could not be loaded"
              message="Refresh the page or try again after checking your connection."
              className="m-6"
            />
          ) : orders.length === 0 ? (
            <MessageState
              tone="empty"
              title="No orders yet"
              message="Start shopping to see your order history, payment totals, and delivery status here."
              action={
                <Link to="/shop" className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
                  Browse products
                </Link>
              }
              className="m-6"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                
                {/* Head */}
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y">
                  {orders.map((order, idx) => (
                    <tr
                      key={order._id || idx}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-500">
                        {idx + 1}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {order.orderId || order._id}
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            statusStyles[order.status] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-800">
                        ${order.amount?.toFixed(2) ?? "0.00"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/order/${order._id}`}
                          className="text-indigo-600 font-medium hover:underline"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default UserOrders;
