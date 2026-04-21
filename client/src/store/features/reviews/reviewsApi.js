import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import getBaseUrl from "../../../utils/baseUrl";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/reviews`,
    credentials: "include",
  }),
  tagTypes: ["Reviews"],

  endpoints: (builder) => ({
    // Get reviews by PRODUCT ID
    getReviewsByProductId: builder.query({
      query: (productId) => `/product/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Reviews", id: productId },
      ],
    }),

    // Get reviews by USER ID 
    getReviewsByUserId: builder.query({
      query: (userId) => `/${userId}`, 
      providesTags: (result) =>
        result && Array.isArray(result)
          ? result.map(({ _id }) => ({ type: "Reviews", id: _id }))
          : [],
    }),

    //  Post review
    postReview: builder.mutation({
      query: (newReview) => ({
        url: "/post-review",
        method: "POST",
        body: newReview,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: "Reviews", id: productId },
        "Reviews",
      ],
    }),

    //  Total reviews
    getTotalReviews: builder.query({
      query: () => "/total-reviews",
      providesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetReviewsByProductIdQuery,
  useGetReviewsByUserIdQuery,
  usePostReviewMutation,
  useGetTotalReviewsQuery,
} = reviewsApi;