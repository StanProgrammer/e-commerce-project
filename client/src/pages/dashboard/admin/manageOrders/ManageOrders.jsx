import React, { useState } from "react";
import {
  useDeleteOrderMutation,
  useGetAllOrdersQuery,
} from "../../../../store/features/orders/orderApi";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import UpdateOrderModal from "./UpdateOrderModal";
import MessageState from "../../../../components/MessageState";
import Pagination from "../../../../components/Pagination";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";

const ORDERS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Canceled", value: "canceled" },
];

const ManageOrders = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, error, refetch } =
    useGetAllOrdersQuery({ page, limit: ORDERS_PER_PAGE, status: statusFilter });

  const [deleteOrder, { isLoading: isDeleting }] =
    useDeleteOrderMutation();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const orders = data?.orders || [];
  const totalOrders = data?.totalOrders || 0;
  const totalPages = data?.totalPages || 1;

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage >= 1 && nextPage <= totalPages) {
      setPage(nextPage);
    }
  };

  const handleEditStatus = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmDelete) return;

    try {
      await deleteOrder(orderId).unwrap();
      toast.success("Order deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(
        getApiErrorMessage(err, "Order could not be deleted. Refresh the list and try again.")
      );
    }
  };

  /* Loading state */
  if (isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Manage Orders
        </h2>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 rounded"
            />
          ))}
        </div>
      </div>
    );
  }

  /* Error state */
  if (isError) {
    return (
      <div className="p-6">
        <MessageState
          tone="error"
          title="Orders could not be loaded"
          message={getApiErrorMessage(error, "Refresh the page. If this continues, check that the server is running.")}
          action={
            <button
              onClick={refetch}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="section__container p-4 sm:p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <h2 className="text-xl sm:text-2xl font-semibold">
          Manage Orders
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary"
            aria-label="Filter orders by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            Total: {totalOrders}
          </span>
        </div>
      </div>

      {/* ---------------- Empty State ---------------- */}
      {orders.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <MessageState
            tone="empty"
            title={statusFilter ? `No ${statusFilter} orders` : "No orders yet"}
            message="Customer orders will appear here after checkout."
          />
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">
                  Order Id
                </th>
                <th className="py-3 px-4 text-left">
                  Customer
                </th>
                <th className="py-3 px-4 text-left">
                  Status
                </th>
                <th className="py-3 px-4 text-left">
                  Date
                </th>
                <th className="py-3 px-4 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {order?.orderId}
                  </td>

                  <td className="py-3 px-4 text-gray-600">
                    {order?.email}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full text-white ${getStatusColor(
                        order?.status
                      )}`}
                    >
                      {order?.status}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-gray-500">
                    {formatDate(order?.updatedAt)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex gap-3 text-sm">
                      <Link
                        to={`/order/${order._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>

                      <button
                        onClick={() =>
                          handleEditStatus(order)
                        }
                        className="text-green-600 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        disabled={isDeleting}
                        onClick={() =>
                          handleDeleteOrder(order._id)
                        }
                        className="text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        {isDeleting
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------- Pagination ---------------- */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* ---------------- Modal ---------------- */}
      {selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

/* Helpers */

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
};

const getStatusColor = (status = "") => {
  const normalized = status.toLowerCase();

  switch (normalized) {
    case "pending":
      return "bg-yellow-500";
    case "processing":
      return "bg-blue-500";
    case "shipped":
      return "bg-purple-500";
    case "delivered":
      return "bg-green-600";
    case "canceled":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export default ManageOrders;
