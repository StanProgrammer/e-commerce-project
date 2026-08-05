import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useGetReviewsByUserIdQuery } from "../../../store/features/reviews/reviewsApi";
import { useGetOrdersByEmailQuery } from "../../../store/features/orders/orderApi";
import { useNavigate } from "react-router-dom";
import MessageState from "../../../components/MessageState";
import ReviewModal from "../../Shop/reviews/ReviewModal";
import { getProductPrimaryImage } from "../../../utils/productImage";

const reviewableOrderStatuses = new Set(["processing", "shipped", "delivered"]);

const StarRating = ({ rating }) => {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <span key={i}>
          {i < rating ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-3 bg-gray-200 rounded w-full"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
  </div>
);

const UserReviews = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [selectedReviewProductId, setSelectedReviewProductId] = useState("");

  const {
    data: reviews = [],
    isLoading,
    isError,
    refetch: refetchReviews,
  } = useGetReviewsByUserIdQuery(user?._id, {
    skip: !user?._id,
  });

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useGetOrdersByEmailQuery(user?.email ?? "", {
    skip: !user?.email,
  });

  const productsById = new Map();

  orders
    .filter((order) => reviewableOrderStatuses.has(order.status))
    .flatMap((order) => order.products || [])
    .forEach((item) => {
      const product = item.productId;
      const productId = product?._id || product;

      if (productId && typeof product === "object" && !product.isDeleted) {
        productsById.set(String(productId), product);
      }
    });

  const products = Array.from(productsById.values());

  const getReviewProductId = (review) =>
    typeof review.productId === "object" ? review.productId?._id : review.productId;

  const getReviewProductLabel = (review) =>
    review.productName || review.productId?.name || getReviewProductId(review);

  const handleReviewClick = (productId) => {
    if (productId) {
      navigate(`/shop/${productId}`);
    }
  };

  const handleAddReview = () => {
    setIsProductPickerOpen(true);
  };

  const handleProductSelect = (productId) => {
    setSelectedReviewProductId(productId);
    setIsProductPickerOpen(false);
  };

  const handleCloseReviewModal = () => {
    setSelectedReviewProductId("");
  };

  return (
    <div className="py-8 px-2 sm:px-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        My Reviews
      </h2>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <MessageState
          tone="error"
          title="Reviews could not be loaded"
          message="Refresh the page or try again after checking your connection."
        />
      )}

      {/* Content */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Reviews */}
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review._id}
                onClick={() => handleReviewClick(getReviewProductId(review))}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer border border-gray-100 hover:border-gray-200"
              >
                {/* Rating */}
                <div className="flex items-center justify-between mb-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-gray-500">
                    {review.rating}/5
                  </span>
                </div>

                {/* Comment */}
                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                  {review.comment}
                </p>

                {/* Footer */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    <span className="font-medium text-gray-600">
                      Product:
                    </span>{" "}
                    {getReviewProductLabel(review)}
                  </p>
                  <p>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 mb-2">
                You haven’t written any reviews yet.
              </p>
              <button
                onClick={handleAddReview}
                className="mt-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Write your first review
              </button>
            </div>
          )}

          {/* Add Review Card */}
          <div
            onClick={handleAddReview}
            className="flex flex-col items-center justify-center rounded-xl p-6 border-2 border-dashed border-gray-300 cursor-pointer 
            hover:border-black hover:bg-gray-50 transition-all duration-200 group"
          >
            <span className="text-4xl mb-2 group-hover:scale-110 transition">
              +
            </span>
            <p className="text-sm font-medium text-gray-600 group-hover:text-black">
              Add New Review
            </p>
          </div>
        </div>
      )}

      {isProductPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Choose a product to review</h3>
                <p className="text-sm text-gray-500">Pick the product first, then add your rating and comment.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="rounded-full p-2 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close product picker"
              >
                &times;
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {isOrdersLoading ? (
                <MessageState tone="loading" title="Loading products" message="Finding products you have purchased." />
              ) : isOrdersError ? (
                <MessageState tone="error" title="Products could not be loaded" message="Please try again in a moment." />
              ) : products.length === 0 ? (
                <MessageState
                  tone="empty"
                  title="No purchased products to review"
                  message="Products will appear here after your paid orders are processed."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleProductSelect(product._id)}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-black hover:shadow-md"
                    >
                      <img
                        src={getProductPrimaryImage(product)}
                        alt={product.name || "Product"}
                        className="h-40 w-full object-cover"
                      />
                      <div className="p-4">
                        <p className="line-clamp-2 font-semibold text-gray-900">{product.name}</p>
                        <p className="mt-1 text-sm text-gray-500">${product.price}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={Boolean(selectedReviewProductId)}
        productId={selectedReviewProductId}
        onClose={handleCloseReviewModal}
        onSubmitted={refetchReviews}
      />
    </div>
  );
};

export default UserReviews;
