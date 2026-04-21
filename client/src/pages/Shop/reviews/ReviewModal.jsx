import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { usePostReviewMutation } from "../../../store/features/reviews/reviewsApi";

import toast from "react-hot-toast";
import { useGetSingleProductQuery } from "../../../store/features/products/productsApi";

const ReviewModal = ({ isOpen, onClose }) => {
  const { id: productId } = useParams();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { refetch } = useGetSingleProductQuery(productId, {
    skip: !productId,
  });

  const [postReview, { isLoading }] = usePostReviewMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || !comment.trim()) {
      toast.error("Please provide both rating and comment.");
      return;
    }

    try {
      await postReview({
        productId,
        rating,
        comment,
      }).unwrap();

      toast.success("Review submitted successfully!");
      setComment("");
      setRating(0);
      onClose();
      refetch();
    } catch (err) {
      const validationError = err?.data?.details?.[0]?.message;
      const generalError = err?.data?.message;

      toast.error(validationError || generalError || "Failed to submit review");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-2">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Add Your Review</h2>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="text-3xl text-yellow-600 focus:outline-none cursor-pointer"
            >
              {rating >= star ? <i className="ri-star-fill" /> : <i className="ri-star-line" />}
            </button>
          ))}
        </div>

        {/* Comment */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
            className="w-full border rounded-md p-3 mb-4 resize-none"
            rows={4}
          />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md cursor-pointer">
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary cursor-pointer text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
