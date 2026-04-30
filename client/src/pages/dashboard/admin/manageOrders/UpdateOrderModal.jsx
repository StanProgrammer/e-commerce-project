import React, { useEffect, useState } from "react";
import { useUpdateOrderStatusMutation } from "../../../../store/features/orders/orderApi";
import toast from "react-hot-toast";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";

const UpdateOrderModal = ({ order, isOpen, onClose }) => {
  const [status, setStatus] = useState("");

  const [updateOrderStatus, { isLoading, error }] =
    useUpdateOrderStatusMutation();

  useEffect(() => {
    if (order?.status) {
      setStatus(order.status.toLowerCase());
    }
  }, [order]);

  const handleUpdateOrderStatus = async () => {
    if (!order?._id) {
      toast.error("This order could not be identified. Close the modal and open the order again.");
      return;
    }

    try {
      await updateOrderStatus({
        orderId: order._id,
        status,
      }).unwrap();

      toast.success(`Order status updated to ${status}.`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        getApiErrorMessage(err, "Order status could not be updated. Please try again.")
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
        
        <h2 className="text-lg font-semibold text-gray-800 mb-5">
          Update Order Status
        </h2>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3">
            {getApiErrorMessage(error, "Order status could not be updated. Please try again.")}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleUpdateOrderStatus}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrderModal;
