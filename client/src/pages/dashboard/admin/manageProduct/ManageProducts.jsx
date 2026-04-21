import React, { useState, useCallback } from "react";
import {
  useDeleteProductMutation,
  useFetchAllProductsQuery,
} from "../../../../store/features/products/productsApi";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const PRODUCTS_PER_PAGE = 10;

const ManageProducts = () => {
  const [currentPage, setCurrentPage] = useState(1);


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
      toast.error("Failed to delete product");
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
      <div className="text-center text-red-500 mt-10">
        Failed to load products
      </div>
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
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-175 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b">
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Edit</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <tr
                    key={product._id}
                    className="border-b last:border-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {(currentPage - 1) * PRODUCTS_PER_PAGE + index + 1}
                    </td>

                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {product.name}
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
                ))
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