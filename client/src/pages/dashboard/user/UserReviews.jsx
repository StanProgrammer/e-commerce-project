import React from "react";
import { useSelector } from "react-redux";
import { useGetReviewsByUserIdQuery } from "../../../store/features/reviews/reviewsApi";
import { useNavigate } from "react-router-dom";
import MessageState from "../../../components/MessageState";

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

  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useGetReviewsByUserIdQuery(user?._id, {
    skip: !user?._id,
  });

  const handleReviewClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddReview = () => {
    navigate("/shop");
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
                onClick={() => handleReviewClick(review.productId)}
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
                    {review.productName || review.productId}
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
    </div>
  );
};

export default UserReviews;
