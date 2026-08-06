import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import reviewAvatar from "../../../assets/avatar.png";
import Ratings from "../../../components/Ratings";
import ReviewModal from "./ReviewModal";
import { useGetMyOrdersQuery } from "../../../store/features/orders/orderApi";

const reviewableOrderStatuses = new Set(["processing", "shipped", "delivered"]);

const ReviewCard = ({ productReviews = [] }) => {
  const { id: productId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: orders = [] } = useGetMyOrdersQuery(undefined, {
    skip: !user,
  });

  const hasPurchasedProduct = orders.some(
    (order) =>
      reviewableOrderStatuses.has(order.status) &&
      (order.products || []).some((item) => String(item.productId?._id || item.productId) === String(productId))
  );

  const openReviewModal = () => {
    if (!hasPurchasedProduct) return;
    setIsModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsModalOpen(false);
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:rounded-4xl">
      <div className="border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/70 px-5 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Reviews</p>
            <h3 className="text-2xl font-semibold text-text-dark">Customer Reviews</h3>
            <p className="mt-1 text-sm text-text-light">
              {productReviews.length > 0
                ? `${productReviews.length} ${productReviews.length === 1 ? "review" : "reviews"} from shoppers`
                : "Be the first to share your experience with this product."}
            </p>
          </div>

          <button
            type="button"
            disabled={!hasPurchasedProduct}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 md:w-auto cursor-pointer"
            onClick={openReviewModal}
          >
            {hasPurchasedProduct ? "Add Your Review" : "Purchase to Review"}
          </button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-8 sm:py-7">
        <div className="space-y-4 sm:space-y-5">
          {productReviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-text-light">
              No reviews yet. Your feedback can help the next shopper decide.
            </div>
          ) : (
            productReviews.map((review) => {
              const username = review?.userId?.username || "Anonymous";

              return (
                <article
                  key={review._id}
                  className="rounded-3xl border border-slate-200 bg-slate-50/65 p-4 transition hover:border-blue-200 hover:bg-white sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-center gap-3 sm:w-auto sm:flex-col sm:items-start">
                      <img
                        src={reviewAvatar}
                        alt={`${username} avatar`}
                        className="h-12 w-12 shrink-0 rounded-full border border-blue-100 object-cover sm:h-14 sm:w-14"
                      />
                      <div className="min-w-0 sm:hidden">
                        <h4 className="truncate text-base font-semibold text-text-dark">{username}</h4>
                        <span className="text-xs text-text-light">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hidden items-start justify-between gap-4 sm:flex">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-semibold text-text-dark">{username}</h4>
                          <div className="mt-1">
                            <Ratings rating={review.rating} />
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm text-text-light shadow-sm">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 sm:hidden">
                        <Ratings rating={review.rating} />
                      </div>

                      <p className="mt-3 text-sm leading-7 text-slate-700 sm:mt-4 sm:text-base">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <ReviewModal isOpen={isModalOpen} onClose={closeReviewModal} />
    </div>
  );
};

export default ReviewCard;
