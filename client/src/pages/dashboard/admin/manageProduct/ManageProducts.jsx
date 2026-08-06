import React, { useState, useCallback } from "react";
import {
  useDeleteProductMutation,
  useFetchAllProductsQuery,
  useUpdateStockMutation,
} from "../../../../store/features/products/productsApi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import MessageState from "../../../../components/MessageState";
import getApiErrorMessage from "../../../../utils/getApiErrorMessage";
import { getStockInfo, STOCK_STATUS_META } from "../../../../utils/stockStatus";

const PRODUCTS_PER_PAGE = 10;

const STATUS_BADGE_CLASSES = {
  in: "bg-emerald-50 text-emerald-700 border-emerald-200",
  low: "bg-amber-50 text-amber-700 border-amber-200",
  out: "bg-red-50 text-red-700 border-red-200",
  unlimited: "bg-gray-50 text-gray-500 border-gray-200",
};

const ROW_TINT = {
  low: "bg-amber-50/40 hover:bg-amber-50/70",
  out: "bg-red-50/40 hover:bg-red-50/70",
};

const ManageProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [stockDrafts, setStockDrafts] = useState({});
  const [savingStockId, setSavingStockId] = useState(null);

  const {
    data = {},
    isLoading,
    isError,
  } = useFetchAllProductsQuery({
    category: "",
    color: "",
    minPrice: "",
    maxPrice: "",
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
  });

  const { products = [], totalPages = 1, totalProducts = 0 } = data;

  const [deleteProduct, { isLoading: isDeleting }] =
    useDeleteProductMutation();

  const [updateStock] = useUpdateStockMutation();

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const handleDeleteProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      await deleteProduct(id).unwrap();
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(getApiErrorMessage(error, "Product could not be deleted. Refresh the list and try again."));
    }
  };

  const handleStockDraftChange = (id, value) => {
    setStockDrafts((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveStock = async (product) => {
    const raw = stockDrafts[product._id];
    const trimmed = String(raw ?? "").trim();

    // Empty input clears stock tracking (unlimited), matching the form's
    // "leave empty for unlimited" behaviour.
    const value = trimmed === "" ? null : Number(trimmed);

    if (value !== null && (!Number.isInteger(value) || value < 0)) {
      toast.error("Enter a whole number of items (0 or more), or leave empty for unlimited.");
      return;
    }

    if (value !== null && value > 1000000) {
      toast.error("Stock cannot exceed 1,000,000.");
      return;
    }

    setSavingStockId(product._id);

    try {
      await updateStock({ id: product._id, stock: value }).unwrap();
      toast.success(
        value === null
          ? `Stock tracking cleared for "${product.name}"`
          : `Stock for "${product.name}" updated to ${value}`
      );
    } catch (error) {
      console.error("Stock update error:", error);
      toast.error(getApiErrorMessage(error, "Stock could not be updated. Try again."));
    } finally {
      setSavingStockId(null);
      setStockDrafts((prev) => {
        const next = { ...prev };
        delete next[product._id];
        return next;
      });
    }
  };

  // ---------------- STATES ----------------

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        Loading products...
      </div>
    );
  }

  if (isError) {
    return (
      <MessageState
        tone="error"
        title="Products could not be loaded"
        message="Refresh the page. If this continues, check that the server is running."
        className="mt-10"
      />
    );
  }

  return (
    <section className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-6 border-b gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              All Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {products.length} of {totalProducts} products
            </p>
          </div>
          <p className="text-xs text-gray-400">
            Tip: type a number in the Stock column and press the save icon, or
            leave it empty to mark a product as unlimited.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-175 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Edit</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-10 text-gray-500"
                  >
                    No products found. Add a product to start managing your catalog.
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const stockInfo = getStockInfo(product.stock);
                  const draftValue =
                    stockDrafts[product._id] ??
                    (stockInfo.tracksStock ? String(stockInfo.stock) : "");
                  const isSaving = savingStockId === product._id;

                  return (
                    <tr
                      key={product._id}
                      className={`border-b last:border-0 transition ${
                        ROW_TINT[stockInfo.status] ?? "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {(currentPage - 1) * PRODUCTS_PER_PAGE + index + 1}
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {product.name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={draftValue}
                            onChange={(e) =>
                              handleStockDraftChange(product._id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveStock(product);
                              if (e.key === "Escape") {
                                setStockDrafts((prev) => {
                                  const next = { ...prev };
                                  delete next[product._id];
                                  return next;
                                });
                              }
                            }}
                            disabled={isSaving}
                            title="Quantity on hand. Leave empty and save to make the product unlimited."
                            className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-center text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none disabled:opacity-50"
                          />
                          <button
                            onClick={() => handleSaveStock(product)}
                            disabled={isSaving}
                            title="Save stock level"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            {isSaving ? (
                              <i className="ri-loader-4-line animate-spin" />
                            ) : (
                              <i className="ri-check-line" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            STATUS_BADGE_CLASSES[stockInfo.status]
                          }`}
                        >
                          <span aria-hidden="true">
                            {STOCK_STATUS_META[stockInfo.status].emoji}
                          </span>
                          {stockInfo.label}
                          {stockInfo.status === "low" && stockInfo.stock !== null
                            ? ` · ${stockInfo.stock} left`
                            : ""}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {product.createdAt
                          ? new Date(
                              product.createdAt
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/dashboard/update-product/${product._id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          Edit
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          disabled={isDeleting}
                          onClick={() =>
                            handleDeleteProduct(product._id)
                          }
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-center items-center gap-2 p-5 border-t">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 cursor-pointer py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 cursor-pointer py-1.5 text-sm rounded-md transition ${
                  currentPage === page
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 cursor-pointer py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default ManageProducts;
